/* Oficinas — aluno: vê e participa (RF07); professor: gerencia as suas (RF03) */
(function () {
  'use strict';
  const usuario = EAP.shell.montar({ secao: 'oficinas', perfis: ['aluno', 'professor'] });
  if (!usuario) return;

  const { el, $ } = EAP.dom;
  const D = EAP.dados;
  const ehProfessor = usuario.perfil === 'professor';

  $('#descricao').textContent = ehProfessor
    ? 'Cadastre oficinas com passo a passo e acompanhe quem está participando.'
    : 'Escolha uma oficina, participe e siga o passo a passo para criar algo novo com materiais reaproveitados.';
  if (ehProfessor) $('#btn-nova').hidden = false;

  const professores = new Map(EAP.usuarios.listarPublico().map((u) => [u.id, u]));
  D.materiais.listar().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).forEach((m) => $('#material').append(el('option', { value: m.id }, m.nome)));

  const ABAS = ehProfessor
    ? [{ id: 'minhas', rotulo: 'Minhas oficinas' }, { id: 'outras', rotulo: 'De outros professores' }]
    : [{ id: 'disponiveis', rotulo: 'Disponíveis' }, { id: 'minhas', rotulo: 'Minhas oficinas' }, { id: 'encerradas', rotulo: 'Encerradas' }];

  const pedida = EAP.util.parametros().get('aba');
  const estado = { aba: ABAS.some((a) => a.id === pedida) ? pedida : ABAS[0].id, busca: '', material: '' };

  const ORDEM_STATUS = { aberta: 0, rascunho: 1, encerrada: 2 };
  const ordenar = (a, b) =>
    a.status !== b.status ? ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status] : a.status === 'encerrada' ? b.data.localeCompare(a.data) : a.data.localeCompare(b.data);

  function oficinasDaAba(idAba) {
    const todas = D.oficinas.listar();
    if (ehProfessor) {
      return idAba === 'minhas' ? todas.filter((o) => o.professorId === usuario.id) : todas.filter((o) => o.professorId !== usuario.id && o.status !== 'rascunho');
    }
    const visiveis = todas.filter((o) => o.status !== 'rascunho');
    if (idAba === 'disponiveis') return visiveis.filter((o) => o.status === 'aberta');
    if (idAba === 'minhas') {
      const minhas = new Set(D.inscricoes.listar().filter((i) => i.alunoId === usuario.id).map((i) => i.oficinaId));
      return visiveis.filter((o) => minhas.has(o.id));
    }
    return visiveis.filter((o) => o.status === 'encerrada');
  }

  const abas = EAP.comp.abas({
    rotulo: 'Grupos de oficinas',
    ativa: estado.aba,
    itens: ABAS.map((a) => ({ ...a, contador: oficinasDaAba(a.id).length })),
    aoTrocar: (id) => { estado.aba = id; renderizar(); },
  });
  $('#abas').append(abas.no);

  function cartao(o) {
    const insc = ehProfessor ? null : D.inscricaoDoAluno(o.id, usuario.id);
    const vagas = D.vagasRestantes(o);
    const dono = ehProfessor && o.professorId === usuario.id;
    const prof = professores.get(o.professorId);
    const linkDetalhe = EAP.rotas.pagina('oficina-detalhe', { id: o.id });

    let acoes;
    if (ehProfessor) {
      acoes = [
        el('a', { class: 'btn btn--secundario btn--pequeno', href: linkDetalhe }, 'Ver detalhes'),
        dono ? el('a', { class: 'btn btn--secundario btn--pequeno', href: EAP.rotas.pagina('oficina-form', { id: o.id }) }, 'Editar') : null,
        dono ? el('a', { class: 'btn btn--secundario btn--pequeno', href: EAP.rotas.pagina('participacao', { oficina: o.id }) }, 'Participantes') : null,
      ];
    } else if (insc) {
      acoes = [el('a', { class: 'btn btn--primario btn--pequeno', href: linkDetalhe }, insc.concluida ? 'Rever oficina' : 'Continuar')];
    } else {
      acoes = [
        o.status === 'aberta' && vagas > 0 ? el('button', { type: 'button', class: 'btn btn--primario btn--pequeno', onclick: () => participar(o) }, 'Participar') : null,
        el('a', { class: 'btn btn--secundario btn--pequeno', href: linkDetalhe }, 'Ver passo a passo'),
      ];
    }

    let progresso = null;
    if (insc) {
      const p = D.progressoDaInscricao(insc, o);
      progresso = el(
        'div',
        { class: 'cartao-oficina__progresso' },
        el('div', { class: 'cartao-oficina__progresso-topo' }, EAP.comp.chipStatusInscricao(D.statusDaInscricao(insc)), el('span', {}, `${p.feitos} de ${p.total} passos`)),
        EAP.comp.barra(p.pct, `Progresso em ${o.titulo}`)
      );
    }

    const inscritos = D.inscritosDaOficina(o.id).length;
    return el(
      'article',
      { class: 'cartao cartao-oficina' },
      el(
        'div',
        { class: 'cartao-oficina__capa' },
        el('span', { class: 'figurinha-mini figurinha-mini--acento', 'aria-hidden': 'true' }, o.emoji),
        el('div', { class: 'chips' }, EAP.comp.chipStatusOficina(o.status), EAP.comp.chip(EAP.dificuldades[o.dificuldade] || '', 'info'))
      ),
      el('h3', {}, el('a', { href: linkDetalhe }, o.titulo)),
      el('p', { class: 'cartao__texto' }, o.descricao),
      el(
        'ul',
        { class: 'meta' },
        el('li', {}, `📅 ${EAP.fmt.dataCurta(o.data)}${o.horario ? ', ' + o.horario : ''}${o.status === 'aberta' ? ` (${EAP.fmt.relativa(o.data)})` : ''}`),
        el('li', {}, `⏱️ ${EAP.fmt.duracao(o.duracaoMin)}`),
        o.status === 'aberta' ? el('li', {}, vagas > 0 ? `🪑 ${EAP.fmt.plural(vagas, 'vaga')}` : '🪑 Sem vagas') : null,
        ehProfessor && dono ? el('li', {}, `🙋 ${EAP.fmt.plural(inscritos, 'inscrito')}`) : null,
        prof && !dono ? el('li', {}, `🧑‍🏫 ${prof.nome}`) : null
      ),
      progresso,
      el('div', { class: 'acoes' }, acoes)
    );
  }

  function participar(o) {
    const r = D.inscrever(o.id, usuario.id);
    if (!r.ok) { EAP.ui.toast(r.erro, 'erro'); renderizar(); return; }
    EAP.ui.toast(`Você entrou na oficina "${o.titulo}"!`);
    renderizar();
  }

  function renderizar() {
    abas.atualizarContadores(Object.fromEntries(ABAS.map((a) => [a.id, oficinasDaAba(a.id).length])));
    const lista = oficinasDaAba(estado.aba)
      .filter((o) => !estado.material || (o.materiais || []).some((m) => m.materialId === estado.material))
      .filter((o) => !estado.busca || EAP.util.contem(`${o.titulo} ${o.descricao}`, estado.busca))
      .sort(ordenar);

    $('#resumo').textContent = `${EAP.fmt.plural(lista.length, 'oficina')} ${lista.length === 1 ? 'encontrada' : 'encontradas'}`;

    const alvo = $('#lista');
    if (!lista.length) {
      const filtrando = estado.busca || estado.material;
      const vazios = {
        disponiveis: ['🌱', 'Nenhuma oficina aberta agora', 'Volte em breve: os professores estão preparando novas oficinas.'],
        minhas: ['🛠️', ehProfessor ? 'Você ainda não criou oficinas' : 'Você ainda não participa de nenhuma oficina', ehProfessor ? 'Crie a primeira oficina e publique quando estiver pronta.' : 'Vá até "Disponíveis" e clique em "Participar".'],
        encerradas: ['📦', 'Nenhuma oficina encerrada', 'As oficinas que já aconteceram aparecem aqui.'],
        outras: ['👩‍🏫', 'Nenhuma oficina de outros professores', 'Quando colegas publicarem oficinas, elas aparecem aqui.'],
      };
      const [emoji, titulo, texto] = filtrando ? ['🔎', 'Nada com esse filtro', 'Tente outra palavra ou outro material.'] : vazios[estado.aba];
      const acao = !filtrando && ehProfessor && estado.aba === 'minhas' ? el('a', { class: 'btn btn--primario', href: EAP.rotas.pagina('oficina-form') }, 'Criar oficina') : null;
      EAP.dom.montar(alvo, EAP.comp.vazio({ emoji, titulo, texto, acao }));
      return;
    }
    EAP.dom.montar(alvo, lista.map(cartao));
  }

  $('#busca').addEventListener('input', EAP.util.debounce((ev) => { estado.busca = ev.target.value; renderizar(); }, 150));
  $('#material').addEventListener('change', (ev) => { estado.material = ev.target.value; renderizar(); });
  $('#filtros').addEventListener('submit', (ev) => ev.preventDefault());
  renderizar();
})();
