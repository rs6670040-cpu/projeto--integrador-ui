/* Cadastro e edição de material reciclável (RF04) — só professor */
(function () {
  'use strict';
  const usuario = EAP.shell.montar({ secao: 'materiais', perfis: ['professor'] });
  if (!usuario) return;

  const { el, $ } = EAP.dom;
  const D = EAP.dados;
  const idEdicao = EAP.util.parametros().get('id');
  const existente = idEdicao ? D.materiais.obter(idEdicao) : null;

  if (idEdicao && !existente) {
    EAP.shell.redirecionar(EAP.rotas.pagina('materiais'), 'Esse material não existe mais.');
    return;
  }

  // Opções dos seletores
  Object.entries(EAP.categorias).forEach(([chave, cat]) => $('#categoria').append(el('option', { value: chave }, cat.rotulo)));
  const emojis = [...EAP.emojisMaterial];
  if (existente && !emojis.includes(existente.emoji)) emojis.unshift(existente.emoji);
  emojis.forEach((e) => $('#emoji').append(el('option', { value: e }, e)));

  // Ideias de reutilização (lista dinâmica)
  const ideias = EAP.comp.listaDinamica({
    container: $('#ideias'),
    rotuloItem: 'Ideia',
    textoAdicionar: 'Adicionar ideia',
    campos: [
      { chave: 'titulo', rotulo: 'Nome da ideia', obrigatorio: true, placeholder: 'Ex.: Porta-lápis', atributos: { maxlength: 60 } },
      { chave: 'tipo', rotulo: 'É um…', tipo: 'select', padrao: 'objeto', opcoes: [{ valor: 'objeto', rotulo: 'Objeto para criar' }, { valor: 'atividade', rotulo: 'Atividade para fazer' }] },
      { chave: 'descricao', rotulo: 'Como fazer, em poucas palavras', tipo: 'textarea', linhas: 2, obrigatorio: true, atributos: { maxlength: 220 } },
    ],
    itens: existente ? existente.ideias : [],
  });

  if (existente) {
    $('#titulo').textContent = `Editar ${existente.nome}`;
    document.title = `Editar material – Educação ambiental na prática`;
    $('#nome').value = existente.nome;
    $('#categoria').value = existente.categoria;
    $('#emoji').value = existente.emoji;
    $('#quantidade').value = existente.quantidade;
    $('#unidade').value = existente.unidade;
    $('#descricao').value = existente.descricao;
    $('#cuidados').value = existente.cuidados || '';
    $('#btn-excluir').hidden = false;
  } else {
    $('#quantidade').value = 0;
    $('#unidade').value = 'unidades';
  }

  $('#form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const campos = ['nome', 'categoria', 'quantidade', 'unidade', 'descricao'].map((id) => $('#' + id));
    campos.forEach(EAP.ui.limparErroCampo);

    const nome = $('#nome').value.trim();
    const quantidade = Number($('#quantidade').value);
    const unidade = $('#unidade').value.trim();
    const descricao = $('#descricao').value.trim();

    let primeiroErro = null;
    const erro = (id, msg) => { EAP.ui.erroCampo($('#' + id), msg); primeiroErro = primeiroErro || $('#' + id); };

    if (nome.length < 2) erro('nome', 'Digite o nome do material.');
    else if (D.materiais.listar().some((m) => m.id !== idEdicao && EAP.util.semAcento(m.nome) === EAP.util.semAcento(nome))) erro('nome', 'Já existe um material com esse nome.');
    if ($('#quantidade').value === '' || !Number.isInteger(quantidade) || quantidade < 0) erro('quantidade', 'Use um número inteiro, de 0 para cima.');
    if (!unidade) erro('unidade', 'Diga a unidade (garrafas, folhas…).');
    if (descricao.length < 10) erro('descricao', 'Descreva o material com pelo menos 10 letras.');
    const ideiasOk = ideias.validar();

    if (primeiroErro) { primeiroErro.focus(); return; }
    if (!ideiasOk) return;

    const dados = {
      nome,
      categoria: $('#categoria').value,
      emoji: $('#emoji').value,
      quantidade,
      unidade,
      descricao,
      cuidados: $('#cuidados').value.trim(),
      ideias: ideias.obter().map(({ titulo, tipo, descricao: d }) => ({ titulo, tipo, descricao: d })),
    };
    const salvo = existente ? D.materiais.atualizar(existente.id, dados) : D.materiais.criar({ ...dados, criadoPor: usuario.id });
    if (!salvo) { EAP.ui.toast('Não foi possível salvar. O armazenamento do navegador pode estar cheio.', 'erro'); return; }

    EAP.ui.recadoParaProximaTela(existente ? 'Material atualizado.' : 'Material cadastrado.');
    EAP.rotas.ir(EAP.rotas.pagina('materiais'));
  });

  $('#btn-excluir').addEventListener('click', async () => {
    const usos = D.materialEmUso(existente.id);
    if (usos.length) {
      EAP.ui.toast(D.removerMaterial(existente.id).erro, 'erro');
      return;
    }
    const ok = await EAP.ui.confirmar({ titulo: `Excluir "${existente.nome}"?`, mensagem: 'Essa ação não pode ser desfeita. As dicas ligadas a este material continuam publicadas, sem o material.', confirmar: 'Excluir', perigo: true });
    if (!ok) return;
    D.removerMaterial(existente.id);
    EAP.ui.recadoParaProximaTela('Material excluído.');
    EAP.rotas.ir(EAP.rotas.pagina('materiais'));
  });
})();
