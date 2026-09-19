/* Cadastro e edição de oficina, com materiais e passo a passo (RF03) — só professor */
(function () {
  'use strict';
  const usuario = EAP.shell.montar({ secao: 'oficinas', perfis: ['professor'] });
  if (!usuario) return;

  const { el, $ } = EAP.dom;
  const D = EAP.dados;
  const idEdicao = EAP.util.parametros().get('id');
  const existente = idEdicao ? D.oficinas.obter(idEdicao) : null;

  if (idEdicao && !existente) {
    EAP.shell.redirecionar(EAP.rotas.pagina('oficinas'), 'Essa oficina não existe mais.');
    return;
  }
  if (existente && existente.professorId !== usuario.id) {
    EAP.shell.redirecionar(EAP.rotas.pagina('oficina-detalhe', { id: existente.id }), 'Só quem criou a oficina pode editá-la.');
    return;
  }

  /* ----- Opções dos campos ----- */
  const emojis = [...EAP.emojisOficina];
  if (existente && !emojis.includes(existente.emoji)) emojis.unshift(existente.emoji);
  emojis.forEach((e) => $('#emoji').append(el('option', { value: e }, e)));
  Object.entries(EAP.statusOficina).forEach(([v, r]) => $('#status').append(el('option', { value: v }, r)));
  Object.entries(EAP.dificuldades).forEach(([v, r]) => $('#dificuldade').append(el('option', { value: v }, r)));

  EAP.perfis.aluno.opcoes.forEach((ano, i) => {
    $('#anos').append(el('label', { class: 'opcao' }, el('input', { type: 'checkbox', name: 'ano', value: ano, checked: existente ? existente.anos.includes(ano) : false }), ano));
  });

  // Materiais: caixa de marcar + quantidade por aluno
  const materiaisSel = new Map((existente ? existente.materiais : []).map((m) => [m.materialId, m.porAluno]));
  D.materiais.listar().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).forEach((m) => {
    const marcado = materiaisSel.has(m.id);
    const entrada = el('input', { type: 'number', id: `qtd-${m.id}`, min: '0.25', step: '0.25', inputmode: 'decimal', value: String(marcado ? materiaisSel.get(m.id) : 1), disabled: !marcado, 'aria-label': `Quantidade de ${m.nome} por aluno` });
    const caixa = el('input', { type: 'checkbox', id: `mat-${m.id}`, name: 'material', value: m.id, checked: marcado });
    caixa.addEventListener('change', () => { entrada.disabled = !caixa.checked; });
    $('#materiais').append(
      el(
        'div',
        { class: 'material-linha' },
        el('label', { class: 'opcao', for: `mat-${m.id}` }, caixa, `${m.emoji} ${m.nome}${m.quantidade === 0 ? ' (em falta)' : ''}`),
        el('label', { class: 'material-linha__qtd', for: `qtd-${m.id}` }, 'por aluno', entrada)
      )
    );
  });

  // Passo a passo
  const passos = EAP.comp.listaDinamica({
    container: $('#passos'),
    rotuloItem: 'Passo',
    textoAdicionar: 'Adicionar passo',
    minimo: 2,
    campos: [
      { chave: 'titulo', rotulo: 'Título do passo', obrigatorio: true, placeholder: 'Ex.: Pinte e decore', atributos: { maxlength: 60 } },
      { chave: 'descricao', rotulo: 'O que fazer', tipo: 'textarea', linhas: 2, obrigatorio: true, atributos: { maxlength: 300 } },
    ],
    itens: existente ? existente.passos : [],
  });

  /* ----- Valores iniciais ----- */
  if (existente) {
    $('#titulo').textContent = 'Editar oficina';
    document.title = 'Editar oficina – Educação ambiental na prática';
    $('#titulo-oficina').value = existente.titulo;
    $('#emoji').value = existente.emoji;
    $('#descricao').value = existente.descricao;
    $('#objetivo').value = existente.objetivo || '';
    $('#status').value = existente.status;
    $('#data').value = existente.data;
    $('#horario').value = existente.horario || '';
    $('#local').value = existente.local || '';
    $('#dificuldade').value = existente.dificuldade;
    $('#duracao').value = existente.duracaoMin;
    $('#vagas').value = existente.vagas;
    $('#cuidados').value = existente.cuidados || '';
    $('#btn-excluir').hidden = false;
  } else {
    $('#status').value = 'rascunho';
    $('#duracao').value = 60;
    $('#vagas').value = 20;
  }

  /* ----- Salvar ----- */
  $('#form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    ['titulo-oficina', 'descricao', 'data', 'local', 'duracao', 'vagas'].forEach((i) => EAP.ui.limparErroCampo($('#' + i)));
    $('#anos-erro').textContent = '';
    $('#materiais-erro').textContent = '';

    let primeiro = null;
    const erro = (idCampo, msg) => { EAP.ui.erroCampo($('#' + idCampo), msg); primeiro = primeiro || $('#' + idCampo); };

    const titulo = $('#titulo-oficina').value.trim();
    const descricao = $('#descricao').value.trim();
    const duracao = Number($('#duracao').value);
    const vagas = Number($('#vagas').value);
    const anos = [...document.querySelectorAll('input[name="ano"]:checked')].map((i) => i.value);
    const materiais = [...document.querySelectorAll('input[name="material"]:checked')].map((i) => ({ materialId: i.value, porAluno: Number(document.getElementById(`qtd-${i.value}`).value) }));
    const inscritos = existente ? D.inscritosDaOficina(existente.id).length : 0;

    if (titulo.length < 3) erro('titulo-oficina', 'Dê um título para a oficina.');
    if (descricao.length < 10) erro('descricao', 'Descreva a oficina com pelo menos 10 letras.');
    if (!$('#data').value) erro('data', 'Escolha a data.');
    if (!$('#local').value.trim()) erro('local', 'Diga onde a oficina acontece.');
    if (!Number.isInteger(duracao) || duracao < 10 || duracao > 480) erro('duracao', 'Use de 10 a 480 minutos.');
    if (!Number.isInteger(vagas) || vagas < 1) erro('vagas', 'Use pelo menos 1 vaga.');
    else if (vagas < inscritos) erro('vagas', `Já há ${inscritos} inscritos. Use ${inscritos} vagas ou mais.`);

    if (!anos.length) { $('#anos-erro').textContent = 'Marque pelo menos um ano.'; primeiro = primeiro || document.querySelector('input[name="ano"]'); }
    if (!materiais.length) { $('#materiais-erro').textContent = 'Escolha pelo menos um material.'; primeiro = primeiro || document.querySelector('input[name="material"]'); }
    else if (materiais.some((m) => !(m.porAluno > 0))) { $('#materiais-erro').textContent = 'A quantidade por aluno precisa ser maior que zero.'; primeiro = primeiro || document.querySelector('input[name="material"]:checked'); }

    const passosOk = passos.validar();
    if (primeiro) { primeiro.focus(); return; }
    if (!passosOk) return;

    const dados = {
      titulo, descricao,
      objetivo: $('#objetivo').value.trim(),
      emoji: $('#emoji').value,
      status: $('#status').value,
      data: $('#data').value,
      horario: $('#horario').value,
      local: $('#local').value.trim(),
      dificuldade: $('#dificuldade').value,
      duracaoMin: duracao,
      vagas, anos, materiais,
      cuidados: $('#cuidados').value.trim(),
      passos: passos.obter().map((p) => ({ id: p.id || D.novoId('p'), titulo: p.titulo, descricao: p.descricao })),
    };

    const salva = existente ? D.oficinas.atualizar(existente.id, dados) : D.oficinas.criar({ ...dados, professorId: usuario.id });
    if (!salva) { EAP.ui.toast('Não foi possível salvar. O armazenamento do navegador pode estar cheio.', 'erro'); return; }
    EAP.ui.recadoParaProximaTela(existente ? 'Oficina atualizada.' : dados.status === 'rascunho' ? 'Oficina salva como rascunho.' : 'Oficina criada.');
    EAP.rotas.ir(EAP.rotas.pagina('oficina-detalhe', { id: salva.id }));
  });

  $('#btn-excluir').addEventListener('click', async () => {
    const inscritos = D.inscritosDaOficina(existente.id).length;
    const ok = await EAP.ui.confirmar({
      titulo: `Excluir "${existente.titulo}"?`,
      mensagem: inscritos ? `${EAP.fmt.plural(inscritos, 'aluno está inscrito', 'alunos estão inscritos')} e ${inscritos === 1 ? 'perderá' : 'perderão'} o progresso. Se só quer parar de receber inscrições, mude a situação para "Encerrada".` : 'Essa ação não pode ser desfeita.',
      confirmar: 'Excluir',
      perigo: true,
    });
    if (!ok) return;
    D.removerOficina(existente.id);
    EAP.ui.recadoParaProximaTela('Oficina excluída.');
    EAP.rotas.ir(EAP.rotas.pagina('oficinas'));
  });
})();
