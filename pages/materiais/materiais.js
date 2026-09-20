/* Materiais recicláveis — lista para todos (RF05); professor também cadastra e edita (RF04) */
(function () {
  'use strict';
  const usuario = EAP.shell.montar({ secao: 'materiais', perfis: ['aluno', 'professor'] });
  if (!usuario) return;

  const { el, $ } = EAP.dom;
  const D = EAP.dados;
  const ehProfessor = usuario.perfil === 'professor';

  if (ehProfessor) $('#btn-novo').hidden = false;

  // Filtro de categoria com as categorias do sistema
  const seletorCategoria = $('#categoria');
  Object.entries(EAP.categorias).forEach(([chave, cat]) => seletorCategoria.append(el('option', { value: chave }, cat.rotulo)));

  const estado = { busca: '', categoria: '', soDisponiveis: !ehProfessor };
  $('#so-disponiveis').checked = estado.soDisponiveis;

  function cartao(material) {
    const cat = EAP.categorias[material.categoria] || EAP.categorias.outros;
    const disponivel = material.quantidade > 0;
    const ideias = (material.ideias || []).length;
    return el(
      'article',
      { class: 'cartao cartao--faixa', estilo: { '--faixa': cat.cor } },
      el(
        'div',
        { class: 'cartao__topo' },
        el('span', { class: 'figurinha-mini', 'aria-hidden': 'true' }, material.emoji),
        el('div', {}, el('h2', {}, material.nome), EAP.comp.chipCategoria(material.categoria))
      ),
      el('p', { class: 'cartao__texto' }, material.descricao),
      el(
        'ul',
        { class: 'meta' },
        el('li', {}, disponivel ? EAP.comp.chip(`${EAP.fmt.numero(material.quantidade, 0)} ${material.unidade} disponíveis`, 'sucesso') : EAP.comp.chip('Em falta', 'erro')),
        cat.lixeira ? el('li', {}, `🗑️ Lixeira ${cat.lixeira}`) : null
      ),
      material.cuidados ? el('details', { class: 'detalhes' }, el('summary', {}, 'Cuidados ao usar'), el('p', {}, material.cuidados)) : null,
      el(
        'div',
        { class: 'acoes' },
        el('a', { class: 'btn btn--secundario btn--pequeno', href: EAP.rotas.pagina('sugestoes', { material: material.id }) }, ideias ? `Ver ${EAP.fmt.plural(ideias, 'ideia')}` : 'Ver ideias'),
        ehProfessor ? el('a', { class: 'btn btn--secundario btn--pequeno', href: EAP.rotas.pagina('material-form', { id: material.id }) }, 'Editar') : null
      )
    );
  }

  function renderizar() {
    const todos = D.materiais.listar();
    const filtrados = todos
      .filter((m) => !estado.categoria || m.categoria === estado.categoria)
      .filter((m) => !estado.soDisponiveis || m.quantidade > 0)
      .filter((m) => !estado.busca || EAP.util.contem(`${m.nome} ${m.descricao}`, estado.busca))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    $('#resumo').textContent = todos.length
      ? `${EAP.fmt.plural(filtrados.length, 'material', 'materiais')} ${filtrados.length === 1 ? 'encontrado' : 'encontrados'}`
      : '';

    const lista = $('#lista');
    if (!filtrados.length) {
      const acao = ehProfessor && !todos.length ? el('a', { class: 'btn btn--primario', href: EAP.rotas.pagina('material-form') }, 'Cadastrar o primeiro material') : null;
      EAP.dom.montar(
        lista,
        EAP.comp.vazio({
          emoji: '🔎',
          titulo: todos.length ? 'Nenhum material com esse filtro' : 'Ainda não há materiais',
          texto: todos.length ? 'Tente outra palavra, outra categoria ou desmarque "Só os disponíveis".' : 'Quando os professores cadastrarem materiais, eles aparecem aqui.',
          acao,
        })
      );
      return;
    }
    EAP.dom.montar(lista, filtrados.map(cartao));
  }

  $('#busca').addEventListener('input', EAP.util.debounce((ev) => { estado.busca = ev.target.value; renderizar(); }, 150));
  seletorCategoria.addEventListener('change', (ev) => { estado.categoria = ev.target.value; renderizar(); });
  $('#so-disponiveis').addEventListener('change', (ev) => { estado.soDisponiveis = ev.target.checked; renderizar(); });
  $('#filtros').addEventListener('submit', (ev) => ev.preventDefault());

  renderizar();
})();
