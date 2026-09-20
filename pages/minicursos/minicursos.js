/* Conteúdos educativos (minicursos): aluno lê; professor cria e edita os seus */
(function () {
  'use strict';
  const usuario = EAP.shell.montar({ secao: 'minicursos', perfis: ['aluno', 'professor'] });
  if (!usuario) return;

  const { el, $ } = EAP.dom;
  const D = EAP.dados;
  const ehProfessor = usuario.perfil === 'professor';

  $('#descricao').textContent = ehProfessor
    ? 'Crie minicursos com aulas em texto, imagem e vídeo para os alunos estudarem.'
    : 'Estude no seu ritmo: textos, imagens e vídeos sobre reciclagem e meio ambiente.';
  if (ehProfessor) $('#btn-novo').hidden = false;

  const lista = D.minicursos.listar().filter((m) => (ehProfessor ? m.professorId === usuario.id : m.publicado));
  const professores = new Map(EAP.usuarios.listarPublico().map((u) => [u.id, u]));

  function cartao(m) {
    const link = EAP.rotas.pagina('minicurso-detalhe', { id: m.id });
    const resumo = ehProfessor ? null : D.resumoMinicurso(m, usuario.id);
    const prof = professores.get(m.professorId);
    let rotuloBotao = 'Ver conteúdo';
    if (resumo) rotuloBotao = resumo.concluido ? 'Rever' : resumo.iniciado ? 'Continuar' : 'Começar';
    return el(
      'article',
      { class: 'cartao cartao-curso' },
      el(
        'div',
        { class: 'cartao__topo' },
        el('span', { class: 'figurinha-mini figurinha-mini--acento', 'aria-hidden': 'true' }, m.emoji),
        el('div', {}, ehProfessor ? (m.publicado ? EAP.comp.chip('Publicado', 'sucesso') : EAP.comp.chip('Rascunho', 'aviso')) : null, el('h3', {}, el('a', { href: link }, m.titulo)))
      ),
      el('p', { class: 'cartao__texto' }, m.descricao),
      el('ul', { class: 'meta' }, el('li', {}, `📖 ${EAP.fmt.plural(m.aulas.length, 'aula')}`), !ehProfessor && prof ? el('li', {}, `🧑‍🏫 ${prof.nome}`) : null),
      resumo ? el('div', {}, EAP.comp.barra(resumo.pct, `Seu progresso em ${m.titulo}`), el('small', { class: 'texto-suave' }, `${resumo.feitas} de ${resumo.total} aulas`)) : null,
      el(
        'div',
        { class: 'acoes' },
        el('a', { class: `btn ${ehProfessor ? 'btn--secundario' : 'btn--primario'} btn--pequeno`, href: link }, rotuloBotao),
        ehProfessor ? el('a', { class: 'btn btn--secundario btn--pequeno', href: EAP.rotas.pagina('minicurso-form', { id: m.id }) }, 'Editar') : null
      )
    );
  }

  if (!lista.length) {
    EAP.dom.montar($('#lista'), EAP.comp.vazio({
      emoji: '🎓',
      titulo: ehProfessor ? 'Você ainda não criou conteúdos' : 'Ainda não há conteúdos publicados',
      texto: ehProfessor ? 'Crie o primeiro minicurso e publique quando estiver pronto.' : 'Quando os professores publicarem minicursos, eles aparecem aqui.',
      acao: ehProfessor ? el('a', { class: 'btn btn--primario', href: EAP.rotas.pagina('minicurso-form') }, 'Criar conteúdo') : null,
    }));
  } else {
    EAP.dom.montar($('#lista'), lista.map(cartao));
  }
})();
