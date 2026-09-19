/* ==========================================================
   auth-forms.js — fluxo dos formulários de login e cadastro
   O JS de cada página só informa QUAL perfil ela atende:
     EAP.forms.iniciarLogin({ perfil: 'aluno', contaTeste: {...} });
     EAP.forms.iniciarCadastro({ perfil: 'aluno' });
   Assim a regra de negócio fica em um único lugar.
   ========================================================== */
(function (global) {
  'use strict';

  const EAP = global.EAP;
  const ui = EAP.ui;
  const $ = (id) => document.getElementById(id);

  // Se o navegador bloqueou o localStorage, avisa e trava o formulário
  function armazenamentoIndisponivel(alerta, form) {
    if (EAP.armazenamentoOk) return false;
    ui.alerta(
      alerta,
      'erro',
      'Seu navegador bloqueou o armazenamento local. Saia da aba anônima ou libere o armazenamento para usar o sistema.'
    );
    form.querySelectorAll('input, select, button').forEach((el) => (el.disabled = true));
    return true;
  }

  /* ---------------------------- LOGIN ---------------------------- */

  function iniciarLogin(cfg) {
    const form = $('form-login');
    const email = $('email');
    const senha = $('senha');
    const alerta = $('alerta');
    const botao = form.querySelector('[type="submit"]');

    ui.ativarAlternarSenha();
    ui.limparErroAoDigitar(form);
    if (armazenamentoIndisponivel(alerta, form)) return;

    // Recado vindo do cadastro ("Cadastro realizado!") + e-mail já preenchido
    const recado = EAP.flash.ler();
    if (recado) {
      ui.alerta(alerta, recado.tipo, recado.mensagem);
      if (recado.email) email.value = recado.email;
      senha.focus();
    }

    // Conta de teste (bloco a remover antes de publicar)
    if ($('conta-teste') && cfg.contaTeste) {
      $('teste-email').textContent = cfg.contaTeste.email;
      $('teste-senha').textContent = cfg.contaTeste.senha;
      $('btn-preencher').addEventListener('click', () => {
        email.value = cfg.contaTeste.email;
        senha.value = cfg.contaTeste.senha;
        ui.limparErros(form);
        ui.alerta(alerta, null);
        botao.focus();
      });
    }

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      ui.limparErros(form);
      ui.alerta(alerta, null);

      const erroEmail = ui.validarEmail(email.value);
      if (erroEmail) ui.erroCampo(email, erroEmail);
      if (!senha.value) ui.erroCampo(senha, 'Informe sua senha.');

      const primeiroInvalido = form.querySelector('[aria-invalid="true"]');
      if (primeiroInvalido) {
        primeiroInvalido.focus();
        return;
      }

      const resultado = EAP.auth.entrar(email.value, senha.value, cfg.perfil);
      if (!resultado.ok) {
        const link = resultado.perfilCorreto
          ? {
              texto: `Ir para o login de ${EAP.perfis[resultado.perfilCorreto].rotulo}`,
              href: EAP.rotas.login[resultado.perfilCorreto],
            }
          : null;
        ui.alerta(alerta, 'erro', resultado.erro, link);
        return;
      }

      ui.alerta(alerta, 'sucesso', 'Tudo certo! Abrindo seu painel…');
      botao.disabled = true;
      setTimeout(() => (window.location.href = EAP.rotas.painel), 600);
    });
  }

  /* --------------------------- CADASTRO --------------------------- */

  function iniciarCadastro(cfg) {
    const perfil = EAP.perfis[cfg.perfil];
    const form = $('form-cadastro');
    const alerta = $('alerta');
    const botao = form.querySelector('[type="submit"]');

    const campos = {
      nome: $('nome'),
      email: $('email'),
      escola: $('escola'),
      extra: $(perfil.campo), // ano, disciplina ou cargo, conforme o perfil
      senha: $('senha'),
      confirmar: $('confirmar'),
    };

    ui.ativarAlternarSenha();
    ui.limparErroAoDigitar(form);
    ui.preencherOpcoes(campos.extra, perfil.opcoes);
    ui.preencherDatalist($('lista-escolas'), EAP.escolas);
    if (armazenamentoIndisponivel(alerta, form)) return;

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      ui.limparErros(form);
      ui.alerta(alerta, null);

      const invalidos = [];
      const checar = (input, mensagem) => {
        if (!mensagem) return;
        ui.erroCampo(input, mensagem);
        invalidos.push(input);
      };

      checar(campos.nome, EAP.normalizarTexto(campos.nome.value).length < 3 ? 'Informe seu nome completo.' : '');
      checar(campos.email, ui.validarEmail(campos.email.value));
      checar(campos.escola, EAP.normalizarTexto(campos.escola.value).length < 3 ? 'Informe o nome da escola.' : '');
      checar(campos.extra, campos.extra.value ? '' : 'Escolha uma opção.');
      checar(campos.senha, ui.validarSenhaNova(campos.senha.value));
      checar(
        campos.confirmar,
        !campos.confirmar.value
          ? 'Repita a senha.'
          : campos.confirmar.value !== campos.senha.value
            ? 'As senhas não são iguais.'
            : ''
      );

      if (invalidos.length) {
        invalidos[0].focus();
        return;
      }

      const dados = {
        perfil: cfg.perfil,
        nome: campos.nome.value,
        email: campos.email.value,
        escola: campos.escola.value,
        senha: campos.senha.value,
        [perfil.campo]: campos.extra.value,
      };

      const resultado = EAP.usuarios.criar(dados);
      if (!resultado.ok) {
        if (resultado.campo === 'email') {
          ui.erroCampo(campos.email, resultado.erro);
          campos.email.focus();
        } else {
          ui.alerta(alerta, 'erro', resultado.erro);
        }
        return;
      }

      EAP.flash.definir({
        tipo: 'sucesso',
        mensagem: 'Conta criada! Entre com seu e-mail e senha.',
        email: resultado.usuario.email,
      });
      botao.disabled = true;
      window.location.href = EAP.rotas.login[cfg.perfil];
    });
  }

  EAP.forms = { iniciarLogin, iniciarCadastro };
})(window);
