/* ==========================================================
   ui.js — helpers de interface compartilhados
   Validação, mensagens de erro, alertas e campo de senha.
   ========================================================== */
(function (global) {
  'use strict';

  const EAP = (global.EAP = global.EAP || {});

  const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  EAP.ui = {
    /* ---------- Validações (devolvem '' quando está tudo certo) ---------- */

    validarEmail(valor) {
      const email = String(valor || '').trim();
      if (!email) return 'Informe seu e-mail.';
      if (!REGEX_EMAIL.test(email)) return 'Digite um e-mail válido, como nome@escola.com.';
      return '';
    },

    validarSenhaNova(valor) {
      if (!valor) return 'Crie uma senha.';
      if (valor.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
      return '';
    },

    /* ---------- Erros por campo ---------- */

    erroCampo(input, mensagem) {
      const campo = input.closest('.campo');
      campo.classList.add('campo--erro');
      campo.querySelector('.campo__erro').textContent = mensagem;
      input.setAttribute('aria-invalid', 'true');
    },

    limparErroCampo(input) {
      const campo = input.closest('.campo');
      if (!campo) return;
      campo.classList.remove('campo--erro');
      campo.querySelector('.campo__erro').textContent = '';
      input.removeAttribute('aria-invalid');
    },

    limparErros(form) {
      form.querySelectorAll('input, select').forEach((el) => this.limparErroCampo(el));
    },

    // Some o erro de um campo assim que a pessoa volta a digitar nele
    limparErroAoDigitar(form) {
      form.addEventListener('input', (ev) => {
        if (ev.target.matches('input, select')) this.limparErroCampo(ev.target);
      });
    },

    /* ---------- Alerta geral do formulário ---------- */

    // tipo: 'erro' | 'sucesso' | 'info' | null (esconde). link: { texto, href } opcional.
    alerta(elemento, tipo, mensagem, link) {
      elemento.className = 'alerta';
      elemento.textContent = '';
      if (!tipo) {
        elemento.hidden = true;
        return;
      }
      elemento.classList.add('alerta--' + tipo);
      elemento.append(mensagem); // append de texto: nada é interpretado como HTML
      if (link) {
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.texto;
        elemento.append(' ', a);
      }
      elemento.hidden = false;
    },

    /* ---------- Campo de senha: botão Mostrar/Ocultar ---------- */

    ativarAlternarSenha() {
      document.querySelectorAll('[data-alternar-senha]').forEach((botao) => {
        const input = document.getElementById(botao.dataset.alternarSenha);
        botao.addEventListener('click', () => {
          const mostrar = input.type === 'password';
          input.type = mostrar ? 'text' : 'password';
          botao.textContent = mostrar ? 'Ocultar' : 'Mostrar';
          botao.setAttribute('aria-pressed', String(mostrar));
          botao.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
        });
      });
    },

    /* ---------- Listas ---------- */

    preencherOpcoes(select, opcoes) {
      opcoes.forEach((texto) => {
        const opcao = document.createElement('option');
        opcao.value = texto;
        opcao.textContent = texto;
        select.append(opcao);
      });
    },

    preencherDatalist(datalist, itens) {
      if (!datalist) return;
      itens.forEach((texto) => {
        const opcao = document.createElement('option');
        opcao.value = texto;
        datalist.append(opcao);
      });
    },
  };
})(window);
