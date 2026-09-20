/* Leitor de conteúdo: aulas em texto, imagem e vídeo, com progresso do aluno */
(function () {
  'use strict';
  const usuario = EAP.shell.montar({ secao: 'minicursos', perfis: ['aluno', 'professor'] });
  if (!usuario) return;

  const { el, $ } = EAP.dom;
  const D = EAP.dados;
  const ehAluno = usuario.perfil === 'aluno';
  const id = EAP.util.parametros().get('id');
  const inicial = D.minicursos.obter(id);
  const dono = !!inicial && !ehAluno && inicial.professorId === usuario.id;

  if (!inicial || (!inicial.publicado && !dono)) {
    EAP.shell.redirecionar(EAP.rotas.pagina('minicursos'), 'Esse conteúdo não está disponível.');
    return;
  }
  document.title = `${inicial.titulo} – Educação ambiental na prática`;

  /* ----- Conteúdo de cada tipo de aula ----- */
  function corpoTexto(aula) {
    return el('div', { class: 'aula__texto' }, aula.conteudo.split(/\n\s*\n/).map((p) => el('p', {}, p.trim())));
  }

  function corpoImagem(aula) {
    const url = EAP.util.urlSegura(aula.url, { imagem: true });
    if (!url) return el('p', { class: 'texto-suave' }, 'Não foi possível mostrar esta imagem.');
    return el('figure', {}, el('img', { src: url, alt: aula.conteudo || aula.titulo, loading: 'lazy' }), aula.conteudo ? el('figcaption', {}, aula.conteudo) : null);
  }

  // O vídeo só é carregado quando a pessoa clica em "assistir" (economiza dados e não rastreia antes da hora)
  function corpoVideo(aula) {
    const idVideo = EAP.util.youtubeId(aula.url);
    const link = EAP.util.urlSegura(aula.url);
    const legenda = aula.conteudo ? el('p', { class: 'texto-suave' }, aula.conteudo) : null;
    if (!idVideo) {
      return el('div', {}, link ? el('a', { class: 'btn btn--secundario', href: link, target: '_blank', rel: 'noopener noreferrer' }, 'Abrir o vídeo em outra aba') : el('p', { class: 'texto-suave' }, 'Este vídeo não tem um link válido.'), legenda);
    }
    const caixa = el('div', { class: 'video' });
    const botao = el('button', { type: 'button', 'aria-label': `Assistir ao vídeo: ${aula.titulo}` }, '▶');
    botao.addEventListener('click', () => {
      caixa.classList.add('video--ativo');
      EAP.dom.montar(caixa, el('iframe', { src: `https://www.youtube-nocookie.com/embed/${idVideo}?rel=0`, title: aula.titulo, allow: 'accelerometer; encrypted-media; picture-in-picture', allowfullscreen: true, loading: 'lazy', referrerpolicy: 'strict-origin-when-cross-origin' }));
    });
    caixa.append(botao, el('span', {}, 'Clique para assistir'));
    return el('div', { style: 'display:grid;gap:10px' }, caixa, el('a', { href: `https://www.youtube.com/watch?v=${idVideo}`, target: '_blank', rel: 'noopener noreferrer' }, 'Não abriu? Assistir no YouTube'), legenda);
  }

  const CORPOS = { texto: corpoTexto, imagem: corpoImagem, video: corpoVideo };

  /* ----- Página ----- */
  function alternarAula(aulaId, feita) {
    const r = D.marcarAula(id, usuario.id, aulaId, feita);
    if (!r.ok) { EAP.ui.toast(r.erro, 'erro'); return; }
    const resumo = D.resumoMinicurso(D.minicursos.obter(id), usuario.id);
    if (feita && resumo.concluido) EAP.ui.toast('🎉 Você concluiu este conteúdo! Parabéns!');
    renderizar(`aula-${aulaId}`);
  }

  function renderizar(focoId) {
    const m = D.minicursos.obter(id);
    const resumo = ehAluno ? D.resumoMinicurso(m, usuario.id) : null;
    const prog = ehAluno ? D.progressoDoAluno(id, usuario.id) : null;
    const feitas = new Set(prog ? prog.aulasConcluidas : []);
    const prof = EAP.usuarios.obterPublico(m.professorId);

    EAP.dom.montar(
      $('#conteudo'),
      el(
        'header',
        { class: 'curso-topo' },
        el('span', { class: 'curso-topo__figura', 'aria-hidden': 'true' }, m.emoji),
        el(
          'div',
          {},
          !m.publicado ? EAP.comp.chip('Rascunho: só você vê', 'aviso') : null,
          el('h1', {}, m.titulo),
          el('p', {}, m.descricao),
          resumo ? el('div', { style: 'max-width:360px' }, EAP.comp.barra(resumo.pct, 'Seu progresso'), el('small', { class: 'texto-suave' }, `${resumo.feitas} de ${resumo.total} aulas concluídas`)) : null,
          !ehAluno ? el('div', { class: 'acoes' }, prof ? el('span', { class: 'texto-suave' }, `Por ${prof.nome}`) : null, dono ? el('a', { class: 'btn btn--secundario btn--pequeno', href: EAP.rotas.pagina('minicurso-form', { id: m.id }) }, 'Editar conteúdo') : null) : null
        )
      ),
      el(
        'div',
        { class: 'curso-corpo' },
        m.aulas.length
          ? m.aulas.map((aula, i) =>
              el(
                'article',
                { class: 'aula' + (feitas.has(aula.id) ? ' aula--feita' : '') },
                el('h2', {}, el('span', { class: 'aula__numero' }, `Aula ${i + 1} de ${m.aulas.length}`), aula.titulo),
                (CORPOS[aula.tipo] || corpoTexto)(aula),
                ehAluno ? el('label', { class: 'aula__feita', for: `aula-${aula.id}` }, el('input', { type: 'checkbox', id: `aula-${aula.id}`, checked: feitas.has(aula.id), onchange: (ev) => alternarAula(aula.id, ev.target.checked) }), 'Concluí esta aula') : null
              )
            )
          : EAP.comp.vazio({ emoji: '📖', titulo: 'Sem aulas por enquanto', texto: 'Este conteúdo ainda não tem aulas.' })
      )
    );
    if (focoId) { const alvo = document.getElementById(focoId); if (alvo) alvo.focus(); }
  }

  renderizar();
})();
