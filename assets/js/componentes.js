/* ==========================================================
   componentes.js — peças de interface reutilizadas pelas telas
   Todas devolvem elementos DOM (sem innerHTML).
   ========================================================== */
(function (global) {
  'use strict';

  const EAP = global.EAP;
  const { el } = EAP.dom;

  let contadorIds = 0;
  const proximoId = (prefixo) => `${prefixo}-${++contadorIds}`;

  /* ---------- Chips ---------- */

  // variante: 'neutro' | 'sucesso' | 'aviso' | 'info' | 'erro'
  function chip(texto, variante = 'neutro', extra) {
    return el('span', { class: `chip chip--${variante}` }, extra || null, texto);
  }

  function chipCategoria(chave) {
    const cat = EAP.categorias[chave] || EAP.categorias.outros;
    return el('span', { class: 'chip chip--neutro' }, el('span', { class: 'chip__ponto', estilo: { background: cat.cor }, 'aria-hidden': 'true' }), cat.rotulo);
  }

  const VARIANTE_STATUS_OFICINA = { aberta: 'sucesso', encerrada: 'neutro', rascunho: 'aviso' };
  const VARIANTE_STATUS_INSCRICAO = { inscrito: 'info', em_andamento: 'aviso', concluida: 'sucesso' };
  const VARIANTE_STATUS_ATIVIDADE = { planejada: 'info', realizada: 'sucesso', cancelada: 'neutro' };

  /* ---------- Barra de progresso ---------- */

  function barra(pct, rotulo) {
    const valor = Math.max(0, Math.min(100, Math.round(pct)));
    return el(
      'div',
      { class: 'progresso' },
      el(
        'div',
        { class: 'progresso__trilha', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(valor), 'aria-label': rotulo || 'Progresso' },
        el('div', { class: 'progresso__preenchimento', estilo: { width: valor + '%' } })
      ),
      el('span', { class: 'progresso__texto' }, valor + '%')
    );
  }

  /* ---------- Estrelas ---------- */

  function estrelas(nota, max = 5) {
    const n = Math.round(Number(nota) || 0);
    return el('span', { class: 'estrelas', role: 'img', 'aria-label': n ? `Nota ${n} de ${max}` : 'Sem nota' }, '★'.repeat(n) + '☆'.repeat(Math.max(0, max - n)));
  }

  /* ---------- Estado vazio ---------- */

  function vazio({ emoji = '🌱', titulo, texto, acao }) {
    return el(
      'div',
      { class: 'vazio' },
      el('span', { class: 'vazio__emoji', 'aria-hidden': 'true' }, emoji),
      el('h2', {}, titulo),
      texto ? el('p', {}, texto) : null,
      acao || null
    );
  }

  /* ---------- Indicador (número grande + rótulo) ---------- */

  function indicador({ valor, rotulo, detalhe, emoji, destaque = false }) {
    return el(
      'div',
      { class: `indicador${destaque ? ' indicador--destaque' : ''}` },
      emoji ? el('span', { class: 'indicador__emoji', 'aria-hidden': 'true' }, emoji) : null,
      el('span', { class: 'indicador__valor' }, valor),
      el('span', { class: 'indicador__rotulo' }, rotulo),
      detalhe ? el('span', { class: 'indicador__detalhe' }, detalhe) : null
    );
  }

  /* ---------- Abas ---------- */

  // itens: [{ id, rotulo, contador? }]. Devolve { no, definirAtiva(id), atualizarContadores(mapa) }
  function abas({ itens, ativa, aoTrocar, rotulo = 'Seções' }) {
    const no = el('div', { class: 'abas', role: 'tablist', 'aria-label': rotulo });
    let atual = ativa || itens[0].id;

    const botoes = new Map();
    itens.forEach((item) => {
      const contador = el('span', { class: 'abas__contador' }, item.contador === undefined ? '' : String(item.contador));
      const botao = el('button', { type: 'button', class: 'abas__aba', role: 'tab', id: `aba-${item.id}` }, item.rotulo, contador);
      botao.addEventListener('click', () => definirAtiva(item.id, true));
      botoes.set(item.id, { botao, contador });
      no.append(botao);
    });

    // Navegação por setas, como esperado em abas
    no.addEventListener('keydown', (ev) => {
      if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
      const ids = itens.map((i) => i.id);
      const i = ids.indexOf(atual);
      const novo = ids[(i + (ev.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length];
      definirAtiva(novo, true);
      botoes.get(novo).botao.focus();
    });

    function definirAtiva(id, notificar) {
      atual = id;
      botoes.forEach(({ botao }, chave) => {
        botao.setAttribute('aria-selected', String(chave === id));
        botao.tabIndex = chave === id ? 0 : -1;
      });
      if (notificar && aoTrocar) aoTrocar(id);
    }
    definirAtiva(atual, false);

    return {
      no,
      definirAtiva: (id) => definirAtiva(id, false),
      atual: () => atual,
      atualizarContadores(mapa) {
        Object.entries(mapa).forEach(([id, n]) => {
          if (botoes.has(id)) botoes.get(id).contador.textContent = String(n);
        });
      },
    };
  }

  /* ---------- Campo de formulário montado por JS ---------- */

  // tipo: text | number | date | time | email | textarea | select. Devolve { no, input }
  function campo({ id, rotulo, tipo = 'text', valor = '', placeholder, opcoes, ajuda, obrigatorio = false, atributos = {}, linhas = 3 }) {
    const idCampo = id || proximoId('campo');
    let input;
    if (tipo === 'textarea') {
      input = el('textarea', { id: idCampo, rows: linhas, placeholder, required: obrigatorio, ...atributos });
      input.value = valor;
    } else if (tipo === 'select') {
      input = el(
        'select',
        { id: idCampo, required: obrigatorio, ...atributos },
        (opcoes || []).map((o) => el('option', { value: o.valor }, o.rotulo))
      );
      if (valor !== '' && valor !== undefined) input.value = valor; // sem valor: mantém a 1ª opção
    } else {
      input = el('input', { id: idCampo, type: tipo, placeholder, required: obrigatorio, ...atributos });
      input.value = valor;
    }
    const idErro = `${idCampo}-erro`;
    input.setAttribute('aria-describedby', idErro);
    const no = el(
      'div',
      { class: 'campo' },
      el('label', { for: idCampo }, rotulo),
      input,
      ajuda ? el('p', { class: 'campo__ajuda' }, ajuda) : null,
      el('p', { class: 'campo__erro', id: idErro, 'aria-live': 'polite' })
    );
    return { no, input };
  }

  /* ---------- Lista dinâmica (passos, aulas, ideias…) ---------- */

  /*
   cfg = {
     container,                 // onde montar
     rotuloItem: 'Passo',       // "Passo 1", "Passo 2"…
     campos: [{ chave, rotulo, tipo, opcoes, placeholder, linhas, obrigatorio, ajuda, visivelSe(valores), atributos }],
     itens: [],                 // valores iniciais (podem ter id)
     minimo: 0,
     textoAdicionar: 'Adicionar passo',
     validarItem(valores) → { chave: 'mensagem' }   (opcional)
   }
   Devolve { obter(), validar(), adicionar(item), quantidade() }
  */
  function listaDinamica(cfg) {
    const prefixo = proximoId('ld');
    const lista = el('ol', { class: 'lista-dinamica' });
    const erroGeral = el('p', { class: 'campo__erro', 'aria-live': 'polite' });
    const botaoAdicionar = el('button', { type: 'button', class: 'btn btn--secundario' }, cfg.textoAdicionar || 'Adicionar item');
    cfg.container.append(lista, erroGeral, botaoAdicionar);
    let n = 0;

    const valoresDaLinha = (li) => {
      const v = {};
      cfg.campos.forEach((c) => {
        v[c.chave] = li.querySelector(`[data-chave="${c.chave}"]`).value.trim();
      });
      if (li.dataset.itemId) v.id = li.dataset.itemId;
      return v;
    };

    // Uma linha "vazia" é ignorada: nenhum campo de texto preenchido
    const linhaVazia = (li) =>
      cfg.campos.filter((c) => c.tipo !== 'select').every((c) => !li.querySelector(`[data-chave="${c.chave}"]`).value.trim());

    const atualizarVisibilidade = (li) => {
      const valores = valoresDaLinha(li);
      cfg.campos.forEach((c) => {
        if (!c.visivelSe) return;
        li.querySelector(`[data-campo="${c.chave}"]`).hidden = !c.visivelSe(valores);
      });
    };

    const renumerar = () => {
      const linhas = [...lista.children];
      linhas.forEach((li, i) => {
        li.querySelector('.lista-dinamica__titulo').textContent = `${cfg.rotuloItem} ${i + 1}`;
        const [subir, descer, remover] = li.querySelectorAll('.lista-dinamica__acoes button');
        subir.disabled = i === 0;
        descer.disabled = i === linhas.length - 1;
        subir.setAttribute('aria-label', `Mover ${cfg.rotuloItem.toLowerCase()} ${i + 1} para cima`);
        descer.setAttribute('aria-label', `Mover ${cfg.rotuloItem.toLowerCase()} ${i + 1} para baixo`);
        remover.setAttribute('aria-label', `Remover ${cfg.rotuloItem.toLowerCase()} ${i + 1}`);
      });
    };

    function adicionar(item = {}) {
      n += 1;
      const li = el('li', { class: 'lista-dinamica__item' });
      if (item.id) li.dataset.itemId = item.id;

      const subir = el('button', { type: 'button', class: 'btn-icone' }, '↑');
      const descer = el('button', { type: 'button', class: 'btn-icone' }, '↓');
      const remover = el('button', { type: 'button', class: 'btn-icone btn-icone--perigo' }, '✕');
      li.append(
        el('div', { class: 'lista-dinamica__cabeca' }, el('strong', { class: 'lista-dinamica__titulo' }), el('div', { class: 'lista-dinamica__acoes' }, subir, descer, remover))
      );

      cfg.campos.forEach((c) => {
        const { no, input } = campo({
          id: `${prefixo}-${n}-${c.chave}`,
          rotulo: c.rotulo,
          tipo: c.tipo || 'text',
          valor: item[c.chave] === undefined ? (c.padrao === undefined ? '' : c.padrao) : item[c.chave],
          placeholder: c.placeholder,
          opcoes: c.opcoes,
          ajuda: c.ajuda,
          linhas: c.linhas,
          atributos: c.atributos,
        });
        input.dataset.chave = c.chave;
        no.dataset.campo = c.chave;
        li.append(no);
      });

      subir.addEventListener('click', () => {
        if (li.previousElementSibling) lista.insertBefore(li, li.previousElementSibling);
        renumerar();
        subir.disabled ? descer.focus() : subir.focus();
      });
      descer.addEventListener('click', () => {
        if (li.nextElementSibling) lista.insertBefore(li.nextElementSibling, li);
        renumerar();
        descer.disabled ? subir.focus() : descer.focus();
      });
      remover.addEventListener('click', () => {
        li.remove();
        renumerar();
        botaoAdicionar.focus();
      });
      li.addEventListener('input', () => atualizarVisibilidade(li));
      li.addEventListener('change', () => atualizarVisibilidade(li));

      lista.append(li);
      atualizarVisibilidade(li);
      renumerar();
      return li;
    }

    botaoAdicionar.addEventListener('click', () => {
      const li = adicionar({});
      li.querySelector('input, textarea, select').focus();
    });

    (cfg.itens || []).forEach((item) => adicionar(item));
    while (lista.children.length < (cfg.minimo || 0)) adicionar({});

    return {
      quantidade: () => [...lista.children].filter((li) => !linhaVazia(li)).length,
      obter: () => [...lista.children].filter((li) => !linhaVazia(li)).map(valoresDaLinha),
      validar() {
        erroGeral.textContent = '';
        let primeiro = null;
        const marcar = (input, mensagem) => {
          EAP.ui.erroCampo(input, mensagem);
          primeiro = primeiro || input;
        };
        [...lista.children].forEach((li) => {
          li.querySelectorAll('.campo').forEach((c) => EAP.ui.limparErroCampo(c.querySelector('[data-chave]')));
          if (linhaVazia(li)) return;
          const valores = valoresDaLinha(li);
          const extras = cfg.validarItem ? cfg.validarItem(valores) : {};
          cfg.campos.forEach((c) => {
            const visivel = !c.visivelSe || c.visivelSe(valores);
            if (!visivel) return;
            const input = li.querySelector(`[data-chave="${c.chave}"]`);
            if (extras[c.chave]) marcar(input, extras[c.chave]);
            else if (c.obrigatorio && !valores[c.chave]) marcar(input, 'Preencha este campo.');
          });
        });
        const total = [...lista.children].filter((li) => !linhaVazia(li)).length;
        if (total < (cfg.minimo || 0)) {
          erroGeral.textContent = `Adicione pelo menos ${cfg.minimo} ${cfg.minimo === 1 ? cfg.rotuloItem.toLowerCase() : cfg.rotuloItem.toLowerCase() + 's'} completos.`;
          primeiro = primeiro || botaoAdicionar;
        }
        if (primeiro) primeiro.focus();
        return !primeiro;
      },
      adicionar,
    };
  }

  /* ---------- Tabela responsiva ---------- */

  // colunas: [{ rotulo, celula(linha) → nó ou texto, principal?, acoes? }]. Vira lista de cartões no celular.
  function tabela({ colunas, linhas, legenda }) {
    const cabecalho = el('thead', {}, el('tr', {}, colunas.map((c) => el('th', { scope: 'col' }, c.rotulo || el('span', { class: 'somente-leitor' }, 'Ações')))));
    const corpo = el(
      'tbody',
      {},
      linhas.map((linha) =>
        el(
          'tr',
          {},
          colunas.map((c) => el('td', { 'data-rotulo': c.acoes ? '' : c.rotulo, class: c.principal ? 'celula-principal' : c.acoes ? 'celula-acoes' : null }, c.celula(linha)))
        )
      )
    );
    return el('table', { class: 'tabela-responsiva' }, legenda ? el('caption', { class: 'somente-leitor' }, legenda) : null, cabecalho, corpo);
  }

  EAP.comp = {
    tabela,
    chip,
    chipCategoria,
    chipStatusOficina: (s) => chip(EAP.statusOficina[s] || s, VARIANTE_STATUS_OFICINA[s] || 'neutro'),
    chipStatusInscricao: (s) => chip(EAP.statusInscricao[s] || s, VARIANTE_STATUS_INSCRICAO[s] || 'neutro'),
    chipStatusAtividade: (s) => chip(EAP.statusAtividade[s] || s, VARIANTE_STATUS_ATIVIDADE[s] || 'neutro'),
    barra,
    estrelas,
    vazio,
    indicador,
    abas,
    campo,
    listaDinamica,
    proximoId,
  };
})(window);
