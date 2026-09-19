/* Painel inicial de cada perfil: números rápidos e atalhos */
(function () {
  'use strict';
  const usuario = EAP.shell.montar({ secao: 'painel' });
  if (!usuario) return;

  const { el, $ } = EAP.dom;
  const D = EAP.dados;
  const perfil = EAP.perfis[usuario.perfil];

  const numeros = {
    aluno() {
      const minhas = D.inscricoes.listar().filter((i) => i.alunoId === usuario.id);
      const cursos = D.minicursos.listar().filter((m) => m.publicado);
      return [
        EAP.comp.indicador({ valor: minhas.filter((i) => !i.concluida).length, rotulo: 'Oficinas em andamento', emoji: '🔧', destaque: true }),
        EAP.comp.indicador({ valor: minhas.filter((i) => i.concluida).length, rotulo: 'Oficinas concluídas', emoji: '✅' }),
        EAP.comp.indicador({ valor: cursos.filter((m) => D.resumoMinicurso(m, usuario.id).concluido).length, rotulo: 'Conteúdos concluídos', detalhe: `de ${cursos.length} disponíveis`, emoji: '🎓' }),
      ];
    },
    professor() {
      const minhas = D.oficinas.listar().filter((o) => o.professorId === usuario.id);
      const ids = new Set(minhas.map((o) => o.id));
      const alunos = new Set(D.inscricoes.listar().filter((i) => ids.has(i.oficinaId)).map((i) => i.alunoId));
      return [
        EAP.comp.indicador({ valor: minhas.length, rotulo: 'Oficinas', detalhe: `${minhas.filter((o) => o.status === 'aberta').length} com inscrições abertas`, emoji: '🛠️', destaque: true }),
        EAP.comp.indicador({ valor: alunos.size, rotulo: 'Alunos participando', emoji: '🙋' }),
        EAP.comp.indicador({ valor: D.atividades.listar().filter((a) => a.professorId === usuario.id && a.status === 'planejada').length, rotulo: 'Atividades planejadas', emoji: '📅' }),
        EAP.comp.indicador({ valor: D.minicursos.listar().filter((m) => m.professorId === usuario.id).length, rotulo: 'Conteúdos', emoji: '🎓' }),
      ];
    },
    gestor() {
      const todos = EAP.usuarios.listarPublico();
      const inscs = D.inscricoes.listar();
      return [
        EAP.comp.indicador({ valor: todos.filter((u) => u.perfil === 'professor' && u.ativo !== false).length, rotulo: 'Professores ativos', emoji: '🍎', destaque: true }),
        EAP.comp.indicador({ valor: todos.filter((u) => u.perfil === 'aluno' && u.ativo !== false).length, rotulo: 'Alunos ativos', emoji: '🎒' }),
        EAP.comp.indicador({ valor: inscs.length, rotulo: 'Participações em oficinas', emoji: '🛠️' }),
        EAP.comp.indicador({ valor: inscs.filter((i) => i.concluida).length, rotulo: 'Oficinas concluídas', emoji: '✅' }),
      ];
    },
  };

  // Lista extra: o que fazer agora
  function destaque() {
    if (usuario.perfil === 'aluno') {
      const abertas = D.inscricoes.listar().filter((i) => i.alunoId === usuario.id && !i.concluida).map((i) => ({ i, o: D.oficinas.obter(i.oficinaId) })).filter((x) => x.o);
      return el(
        'section',
        { class: 'secao' },
        el('h2', {}, 'Continue de onde parou'),
        abertas.length
          ? el('ul', { class: 'lista-simples' }, abertas.map(({ i, o }) => el('li', {}, el('a', { href: EAP.rotas.pagina('oficina-detalhe', { id: o.id }) }, `${o.emoji} ${o.titulo}`), EAP.comp.barra(D.progressoDaInscricao(i, o).pct, `Progresso em ${o.titulo}`))))
          : EAP.comp.vazio({ emoji: '🌱', titulo: 'Você não tem oficinas em andamento', texto: 'Escolha uma oficina para começar a criar.', acao: el('a', { class: 'btn btn--primario', href: EAP.rotas.pagina('oficinas') }, 'Ver oficinas') })
      );
    }
    if (usuario.perfil === 'professor') {
      const proximas = D.atividades.listar().filter((a) => a.professorId === usuario.id && a.status === 'planejada').sort((a, b) => a.data.localeCompare(b.data)).slice(0, 3);
      return el(
        'section',
        { class: 'secao' },
        el('h2', {}, 'Próximas atividades'),
        proximas.length
          ? el('ul', { class: 'lista-simples' }, proximas.map((a) => el('li', {}, el('a', { href: EAP.rotas.pagina('atividades') }, a.titulo), el('span', { class: 'texto-suave' }, `${EAP.fmt.dataCurta(a.data)} (${EAP.fmt.relativa(a.data)})`))))
          : EAP.comp.vazio({ emoji: '📅', titulo: 'Nenhuma atividade planejada', acao: el('a', { class: 'btn btn--primario', href: EAP.rotas.pagina('atividades') }, 'Planejar atividade') })
      );
    }
    return null;
  }

  const atalhos = EAP.shell.MENUS[usuario.perfil].filter((m) => m.secao !== 'painel');
  EAP.dom.montar(
    $('#conteudo'),
    el('header', { class: 'boas-vindas' }, el('span', { class: 'selo' }, `${perfil.emoji} ${perfil.rotulo}`), el('h1', {}, `Olá, ${EAP.fmt.nomeCurto(usuario.nome)}!`), el('p', {}, usuario.escola)),
    el('div', { class: 'indicadores' }, numeros[usuario.perfil]()),
    destaque(),
    el('section', { class: 'secao' }, el('h2', {}, 'O que você quer fazer?'), el('div', { class: 'atalhos' }, atalhos.map((m) => el('a', { class: 'atalho', href: EAP.rotas.pagina(m.secao) }, el('span', { class: 'atalho__icone', 'aria-hidden': 'true' }, m.icone), el('strong', {}, m.rotulo), el('span', {}, m.texto)))))
  );
})();
