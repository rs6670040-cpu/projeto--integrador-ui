/* Atividades do professor: planejar, editar, marcar como realizada e excluir */
(function () {
  'use strict';
  const usuario = EAP.shell.montar({ secao: 'atividades', perfis: ['professor'] });
  if (!usuario) return;

  const { el, $ } = EAP.dom;
  const D = EAP.dados;
  const dialogo = $('#dlg-atividade');
  let editandoId = null;

  /* ----- Opções dos campos ----- */
  Object.entries(EAP.tiposAtividade).forEach(([v, r]) => $('#atv-tipo').append(el('option', { value: v }, r)));
  Object.entries(EAP.statusAtividade).forEach(([v, r]) => $('#atv-status').append(el('option', { value: v }, r)));
  ['Todas as turmas', ...EAP.perfis.aluno.opcoes].forEach((a) => $('#atv-ano').append(el('option', { value: a }, a)));
  const minhasOficinas = D.oficinas.listar().filter((o) => o.professorId === usuario.id);
  $('#atv-oficina').append(el('option', { value: '' }, 'Nenhuma'));
  minhasOficinas.forEach((o) => $('#atv-oficina').append(el('option', { value: o.id }, o.titulo)));

  const minhas = () => D.atividades.listar().filter((a) => a.professorId === usuario.id);
  const atrasada = (a) => a.status === 'planejada' && EAP.fmt.diasAte(a.data) < 0;

  const abas = EAP.comp.abas({
    rotulo: 'Situação das atividades',
    ativa: 'planejada',
    itens: [{ id: 'planejada', rotulo: 'Planejadas', contador: 0 }, { id: 'realizada', rotulo: 'Realizadas', contador: 0 }, { id: 'cancelada', rotulo: 'Canceladas', contador: 0 }],
    aoTrocar: () => renderizar(),
  });
  $('#abas').append(abas.no);

  /* ----- Lista ----- */
  function cartao(a) {
    const data = EAP.fmt.paraData(a.data);
    const oficina = a.oficinaId ? D.oficinas.obter(a.oficinaId) : null;
    return el(
      'article',
      { class: 'agenda__item' + (atrasada(a) ? ' agenda__item--atrasada' : '') },
      el('div', { class: 'agenda__data', 'aria-hidden': 'true' }, el('span', { class: 'agenda__dia' }, String(data.getDate())), el('span', { class: 'agenda__mes' }, EAP.fmt.dataCurta(a.data).split(' ')[1])),
      el(
        'div',
        { class: 'agenda__corpo' },
        el('div', { class: 'chips' }, EAP.comp.chip(EAP.tiposAtividade[a.tipo] || a.tipo), EAP.comp.chipStatusAtividade(a.status), atrasada(a) ? EAP.comp.chip('Atrasada', 'aviso') : null),
        el('h3', {}, a.titulo),
        el(
          'ul',
          { class: 'meta' },
          el('li', {}, `📅 ${EAP.fmt.diaSemana(a.data)}, ${EAP.fmt.data(a.data)}${a.horario ? ' às ' + a.horario : ''}${a.status === 'planejada' ? ` (${EAP.fmt.relativa(a.data)})` : ''}`),
          el('li', {}, `👥 ${a.ano}`),
          oficina ? el('li', {}, '🛠️ ', el('a', { href: EAP.rotas.pagina('oficina-detalhe', { id: oficina.id }) }, oficina.titulo)) : null
        ),
        a.objetivo ? el('p', {}, a.objetivo) : null,
        el(
          'div',
          { class: 'acoes' },
          a.status === 'planejada' ? el('button', { type: 'button', class: 'btn btn--primario btn--pequeno', onclick: () => marcarRealizada(a) }, 'Marcar como realizada') : null,
          el('button', { type: 'button', class: 'btn btn--secundario btn--pequeno', onclick: () => abrirFormulario(a) }, 'Editar'),
          el('button', { type: 'button', class: 'btn btn--secundario-perigo btn--pequeno', onclick: () => excluir(a) }, 'Excluir')
        )
      )
    );
  }

  function renderizar() {
    const todas = minhas();
    const contagem = { planejada: 0, realizada: 0, cancelada: 0 };
    todas.forEach((a) => contagem[a.status]++);
    abas.atualizarContadores(contagem);

    const proximos7 = todas.filter((a) => a.status === 'planejada' && EAP.fmt.diasAte(a.data) >= 0 && EAP.fmt.diasAte(a.data) <= 7).length;
    const nAtrasadas = todas.filter(atrasada).length;
    EAP.dom.montar(
      $('#resumo'),
      EAP.comp.indicador({ valor: contagem.planejada, rotulo: 'Planejadas', emoji: '📅', destaque: true }),
      EAP.comp.indicador({ valor: proximos7, rotulo: 'Nos próximos 7 dias', emoji: '⏰' }),
      EAP.comp.indicador({ valor: nAtrasadas, rotulo: 'Atrasadas', emoji: '⚠️' }),
      EAP.comp.indicador({ valor: contagem.realizada, rotulo: 'Realizadas', emoji: '✅' })
    );

    const aba = abas.atual();
    const lista = todas.filter((a) => a.status === aba).sort((x, y) => (aba === 'planejada' ? x.data.localeCompare(y.data) : y.data.localeCompare(x.data)));
    if (!lista.length) {
      EAP.dom.montar($('#lista'), EAP.comp.vazio({
        emoji: aba === 'planejada' ? '📅' : aba === 'realizada' ? '✅' : '🗂️',
        titulo: aba === 'planejada' ? 'Nenhuma atividade planejada' : aba === 'realizada' ? 'Nenhuma atividade realizada ainda' : 'Nenhuma atividade cancelada',
        texto: aba === 'planejada' ? 'Clique em "Nova atividade" para planejar a próxima aula, campanha ou visita.' : 'Quando você marcar atividades como realizadas, elas aparecem aqui.',
      }));
      return;
    }
    EAP.dom.montar($('#lista'), lista.map(cartao));
  }

  /* ----- Ações ----- */
  function marcarRealizada(a) {
    D.atividades.atualizar(a.id, { status: 'realizada' });
    EAP.ui.toast(`"${a.titulo}" marcada como realizada.`);
    renderizar();
  }

  async function excluir(a) {
    const ok = await EAP.ui.confirmar({ titulo: `Excluir "${a.titulo}"?`, mensagem: 'Essa ação não pode ser desfeita.', confirmar: 'Excluir', perigo: true });
    if (!ok) return;
    D.atividades.remover(a.id);
    EAP.ui.toast('Atividade excluída.', 'info');
    renderizar();
  }

  function abrirFormulario(a) {
    editandoId = a ? a.id : null;
    ['atv-titulo', 'atv-data'].forEach((id) => EAP.ui.limparErroCampo($('#' + id)));
    $('#dlg-atividade-titulo').textContent = a ? 'Editar atividade' : 'Nova atividade';
    $('#atv-titulo').value = a ? a.titulo : '';
    $('#atv-tipo').value = a ? a.tipo : 'aula';
    $('#atv-ano').value = a ? a.ano : 'Todas as turmas';
    $('#atv-oficina').value = a && a.oficinaId ? a.oficinaId : '';
    $('#atv-data').value = a ? a.data : EAP.dados.hojeISO();
    $('#atv-horario').value = a ? a.horario || '' : '';
    $('#atv-objetivo').value = a ? a.objetivo || '' : '';
    $('#atv-status').value = a ? a.status : 'planejada';
    EAP.ui.abrirDialogo(dialogo);
    $('#atv-titulo').focus();
  }

  // Ao escolher uma oficina, sugere título e data se ainda estiverem em branco
  $('#atv-oficina').addEventListener('change', (ev) => {
    const o = D.oficinas.obter(ev.target.value);
    if (!o) return;
    if (!$('#atv-titulo').value.trim()) $('#atv-titulo').value = `Oficina: ${o.titulo}`;
    $('#atv-tipo').value = 'oficina';
    $('#atv-data').value = o.data;
    if (o.horario) $('#atv-horario').value = o.horario;
  });

  $('#form-atividade').addEventListener('submit', (ev) => {
    ev.preventDefault();
    ['atv-titulo', 'atv-data'].forEach((id) => EAP.ui.limparErroCampo($('#' + id)));
    const titulo = $('#atv-titulo').value.trim();
    let primeiro = null;
    if (titulo.length < 3) { EAP.ui.erroCampo($('#atv-titulo'), 'Dê um título para a atividade.'); primeiro = $('#atv-titulo'); }
    if (!$('#atv-data').value) { EAP.ui.erroCampo($('#atv-data'), 'Escolha a data.'); primeiro = primeiro || $('#atv-data'); }
    if (primeiro) { primeiro.focus(); return; }

    const dados = {
      titulo,
      tipo: $('#atv-tipo').value,
      ano: $('#atv-ano').value,
      oficinaId: $('#atv-oficina').value,
      data: $('#atv-data').value,
      horario: $('#atv-horario').value,
      objetivo: $('#atv-objetivo').value.trim(),
      status: $('#atv-status').value,
    };
    const salva = editandoId ? D.atividades.atualizar(editandoId, dados) : D.atividades.criar({ ...dados, professorId: usuario.id });
    if (!salva) { EAP.ui.toast('Não foi possível salvar.', 'erro'); return; }
    EAP.ui.fecharDialogo(dialogo);
    EAP.ui.toast(editandoId ? 'Atividade atualizada.' : 'Atividade criada.');
    abas.definirAtiva(dados.status);
    renderizar();
  });

  $('#atv-cancelar').addEventListener('click', () => EAP.ui.fecharDialogo(dialogo));
  $('#btn-nova').addEventListener('click', () => abrirFormulario(null));
  renderizar();
})();
