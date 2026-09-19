/* ==========================================================
   app-shell.js — estrutura comum das telas internas
   Barra superior + menu por perfil + proteção de acesso.

   Cada página interna tem este esqueleto no HTML:
     <div class="app" id="app" hidden>
       <header id="shell-topo"></header>
       <nav id="shell-menu"></nav>
       <main class="principal" id="principal">…conteúdo da página…</main>
     </div>
   e, no JS da página:
     const usuario = EAP.shell.montar({ secao: 'materiais', perfis: ['aluno', 'professor'] });
   ========================================================== */
(function (global) {
  'use strict';

  const EAP = global.EAP;
  const { el } = EAP.dom;

  // secao = qual item do menu fica destacado (telas de detalhe/formulário usam a seção "mãe")
  const MENUS = {
    aluno: [
      { secao: 'painel', rotulo: 'Início', icone: '🏠', texto: 'Seu resumo e as oficinas em andamento.' },
      { secao: 'oficinas', rotulo: 'Oficinas', icone: '🛠️', texto: 'Veja as oficinas, participe e siga o passo a passo.' },
      { secao: 'minicursos', rotulo: 'Conteúdos', icone: '🎓', texto: 'Minicursos com textos, imagens e vídeos.' },
      { secao: 'sugestoes', rotulo: 'Ideias de reutilização', icone: '💡', texto: 'O que dá para criar com cada material.' },
      { secao: 'materiais', rotulo: 'Materiais', icone: '🧴', texto: 'Materiais recicláveis disponíveis na escola.' },
    ],
    professor: [
      { secao: 'painel', rotulo: 'Início', icone: '🏠', texto: 'Seu resumo e as próximas atividades.' },
      { secao: 'oficinas', rotulo: 'Oficinas', icone: '🛠️', texto: 'Crie, edite e exclua suas oficinas.' },
      { secao: 'atividades', rotulo: 'Atividades', icone: '📅', texto: 'Planeje aulas, campanhas, visitas e gincanas.' },
      { secao: 'participacao', rotulo: 'Participação dos alunos', icone: '🙋', texto: 'Acompanhe quem participa e registre a conclusão.' },
      { secao: 'minicursos', rotulo: 'Conteúdos', icone: '🎓', texto: 'Crie e edite minicursos com texto, imagem e vídeo.' },
      { secao: 'materiais', rotulo: 'Materiais', icone: '🧴', texto: 'Materiais recicláveis e ideias de reutilização.' },
    ],
    gestor: [
      { secao: 'painel', rotulo: 'Início', icone: '🏠', texto: 'Visão geral do projeto.' },
      { secao: 'professores', rotulo: 'Professores', icone: '🍎', texto: 'Cadastre, edite, desative e exclua professores.' },
      { secao: 'relatorios', rotulo: 'Relatório dos alunos', icone: '📊', texto: 'Alunos em atividade, por professor e oficina.' },
    ],
  };
  function montar({ secao, perfis }) {
    const usuario = EAP.auth.exigirLogin(perfis);
    if (!usuario) return null;

    const perfil = EAP.perfis[usuario.perfil];
    document.body.dataset.perfil = usuario.perfil; // aplica a cor do perfil
    document.documentElement.lang = 'pt-BR';

    const app = document.getElementById('app');
    const topo = document.getElementById('shell-topo');
    const menu = document.getElementById('shell-menu');
    topo.className = 'topo';
    menu.className = 'menu';
    menu.id = 'shell-menu';

    /* ----- Barra superior ----- */
    const botaoMenu = el('button', { type: 'button', class: 'topo__menu', 'aria-label': 'Abrir menu', 'aria-expanded': 'false', 'aria-controls': 'shell-menu' }, '☰');
    const botaoSair = el('button', { type: 'button', class: 'topo__sair' }, 'Sair');

    topo.replaceChildren(
      el('a', { class: 'pular', href: '#principal' }, 'Pular para o conteúdo'),
      botaoMenu,
      el('a', { class: 'topo__marca', href: EAP.rotas.painel }, el('img', { src: '../../assets/img/logo.svg', alt: '', width: '36', height: '36' }), el('span', {}, 'Educação ambiental na prática')),
      el('span', { class: 'topo__espaco' }),
      el('div', { class: 'topo__usuario' }, el('span', { class: 'topo__nome' }, EAP.fmt.nomeCurto(usuario.nome)), el('span', { class: 'selo selo--pequeno' }, `${perfil.emoji} ${perfil.rotulo}`)),
      botaoSair
    );

    /* ----- Menu lateral (gaveta no celular, fixo no desktop) ----- */
    const itens = MENUS[usuario.perfil].map((item) =>
      el(
        'li',
        {},
        el(
          'a',
          { class: 'menu__item', href: EAP.rotas.pagina(item.secao), 'aria-current': item.secao === secao ? 'page' : null },
          el('span', { class: 'menu__icone', 'aria-hidden': 'true' }, item.icone),
          item.rotulo
        )
      )
    );
    menu.setAttribute('aria-label', 'Menu principal');
    menu.replaceChildren(el('ul', { class: 'menu__lista' }, itens), el('p', { class: 'menu__rodape' }, 'Os dados ficam salvos só neste navegador.'));

    const fundo = el('div', { class: 'menu-fundo', hidden: true });
    app.append(fundo);

    const abrirMenu = () => {
      menu.dataset.aberto = 'true';
      fundo.hidden = false;
      botaoMenu.setAttribute('aria-expanded', 'true');
      document.getElementById('principal').inert = true; // foco fica preso no menu enquanto ele está aberto
      const primeiro = menu.querySelector('a');
      if (primeiro) primeiro.focus();
    };
    const fecharMenu = (devolverFoco = true) => {
      menu.dataset.aberto = 'false';
      fundo.hidden = true;
      botaoMenu.setAttribute('aria-expanded', 'false');
      document.getElementById('principal').inert = false;
      if (devolverFoco) botaoMenu.focus();
    };
    botaoMenu.addEventListener('click', () => (menu.dataset.aberto === 'true' ? fecharMenu() : abrirMenu()));
    fundo.addEventListener('click', () => fecharMenu());
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && menu.dataset.aberto === 'true') fecharMenu();
    });

    botaoSair.addEventListener('click', () => {
      EAP.auth.sair();
      EAP.rotas.ir(EAP.rotas.inicio);
    });

    app.hidden = false;

    // Recado deixado pela tela anterior (ex.: "Oficina salva")
    const recado = EAP.flash.ler();
    if (recado) EAP.ui.toast(recado.mensagem, recado.tipo || 'sucesso');

    return usuario;
  }

  // Sai da tela sem mostrar o conteúdo (ex.: item não encontrado) e deixa um recado para a próxima
  function redirecionar(url, mensagem, tipo = 'erro') {
    document.getElementById('app').hidden = true;
    if (mensagem) EAP.ui.recadoParaProximaTela(mensagem, tipo);
    EAP.rotas.trocar(url);
  }

  EAP.shell = { montar, redirecionar, MENUS };
})(window);
