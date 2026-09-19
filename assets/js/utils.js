/* ==========================================================
   utils.js — utilitários compartilhados das telas internas
   EAP.dom   criação segura de elementos (nunca usa innerHTML)
   EAP.fmt   datas, números e textos em português
   EAP.util  parâmetros da URL, busca sem acento, arquivos, links
   EAP.ui    toast, confirmação e diálogos (acrescentados a ui.js)
   ========================================================== */
(function (global) {
  'use strict';

  const EAP = global.EAP;

  /* ---------- DOM ---------- */

  // Propriedades que precisam ser definidas como propriedade (e não como atributo)
  const PROPRIEDADES = new Set(['checked', 'disabled', 'selected', 'hidden', 'required', 'readOnly', 'multiple']);

  function adicionarFilhos(no, filhos) {
    filhos.flat(Infinity).forEach((filho) => {
      if (filho === null || filho === undefined || filho === false) return;
      no.append(filho.nodeType ? filho : document.createTextNode(String(filho)));
    });
  }

  // el('div', { class: 'x', onclick: fn }, 'texto', outroNo)   (texto sempre entra como texto puro)
  function el(tag, props, ...filhos) {
    const no = document.createElement(tag);
    let valor;
    Object.entries(props || {}).forEach(([chave, v]) => {
      if (v === undefined || v === null || v === false) return;
      if (chave === 'value') valor = v; // definido depois dos filhos (importante para <select>)
      else if (chave === 'class') no.className = v;
      else if (chave === 'texto') no.textContent = v;
      else if (chave === 'dataset') Object.assign(no.dataset, v);
      else if (chave === 'estilo') Object.entries(v).forEach(([p, val]) => no.style.setProperty(p, val));
      else if (chave.startsWith('on') && typeof v === 'function') no.addEventListener(chave.slice(2).toLowerCase(), v);
      else if (PROPRIEDADES.has(chave)) no[chave] = v;
      else no.setAttribute(chave, v === true ? '' : v);
    });
    adicionarFilhos(no, filhos);
    if (valor !== undefined) no.value = valor;
    return no;
  }

  EAP.dom = {
    el,
    $: (seletor, raiz) => (raiz || document).querySelector(seletor),
    $$: (seletor, raiz) => [...(raiz || document).querySelectorAll(seletor)],
    limpar: (no) => no.replaceChildren(),
    // Troca o conteúdo de um contêiner
    montar: (no, ...filhos) => {
      no.replaceChildren();
      adicionarFilhos(no, filhos);
      return no;
    },
  };

  /* ---------- Formatação ---------- */

  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const dois = (n) => String(n).padStart(2, '0');

  // Aceita 'AAAA-MM-DD' (data local, sem fuso), ISO completo ou Date
  const paraData = (valor) => {
    if (valor instanceof Date) return valor;
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(valor))) {
      const [a, m, d] = String(valor).split('-').map(Number);
      return new Date(a, m - 1, d);
    }
    return new Date(valor);
  };
  const meiaNoite = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  EAP.fmt = {
    paraData,
    data(valor) {
      if (!valor) return '—';
      const d = paraData(valor);
      return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`;
    },
    dataCurta(valor) {
      if (!valor) return '—';
      const d = paraData(valor);
      return `${d.getDate()} ${MESES[d.getMonth()]}`;
    },
    diaSemana(valor) {
      return DIAS_SEMANA[paraData(valor).getDay()];
    },
    dataHora(valor) {
      if (!valor) return '—';
      const d = paraData(valor);
      return `${EAP.fmt.data(d)} às ${dois(d.getHours())}:${dois(d.getMinutes())}`;
    },
    // Diferença em dias entre a data e hoje (positivo = futuro)
    diasAte(valor) {
      const alvo = meiaNoite(paraData(valor));
      return Math.round((alvo - meiaNoite(new Date())) / 86400000);
    },
    relativa(valor) {
      const n = EAP.fmt.diasAte(valor);
      if (n === 0) return 'hoje';
      if (n === 1) return 'amanhã';
      if (n === -1) return 'ontem';
      return n > 0 ? `em ${n} dias` : `há ${-n} dias`;
    },
    duracao(minutos) {
      const m = Number(minutos) || 0;
      if (m < 60) return `${m} min`;
      const h = Math.floor(m / 60);
      const resto = m % 60;
      return resto ? `${h}h${dois(resto)}` : `${h}h`;
    },
    numero(valor, casas = 2) {
      return Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: casas });
    },
    plural(n, singular, plural) {
      return `${EAP.fmt.numero(n, 0)} ${n === 1 ? singular : plural || singular + 's'}`;
    },
    nomeCurto(nome) {
      return String(nome || '').trim().split(/\s+/)[0] || '';
    },
    iniciais(nome) {
      const partes = String(nome || '').trim().split(/\s+/);
      return ((partes[0] || '')[0] || '') + ((partes.length > 1 ? partes[partes.length - 1] : '')[0] || '');
    },
  };

  /* ---------- Utilidades ---------- */

  const semAcento = (texto) => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  EAP.util = {
    semAcento,
    // Busca "contém" sem diferenciar maiúsculas nem acentos
    contem: (texto, busca) => semAcento(texto).includes(semAcento(busca).trim()),
    parametros: () => new URLSearchParams(window.location.search),
    debounce(fn, ms = 200) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
      };
    },
    baixarArquivo(nome, conteudo, tipo = 'text/csv;charset=utf-8') {
      const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
      const a = el('a', { href: url, download: nome });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    // Aceita só https/http, caminho relativo do projeto ou imagem embutida. Bloqueia javascript: e afins.
    urlSegura(url, { imagem = false } = {}) {
      const u = String(url || '').trim();
      if (!u) return '';
      if (/^https?:\/\//i.test(u)) return u;
      if (/^(\.\.?\/|assets\/)/.test(u)) return u;
      if (imagem && /^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(u)) return u;
      return '';
    },
    // Extrai o id de links do YouTube (watch, youtu.be, embed, shorts)
    youtubeId(url) {
      const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i);
      return m ? m[1] : '';
    },
  };

  /* ---------- Toast, confirmação e diálogos ---------- */

  Object.assign(EAP.ui, {
    toast(mensagem, tipo = 'sucesso') {
      let caixa = document.getElementById('toasts');
      if (!caixa) {
        caixa = el('div', { id: 'toasts', class: 'toasts', role: 'status', 'aria-live': 'polite' });
        document.body.append(caixa);
      }
      const aviso = el('div', { class: `toast toast--${tipo}` }, mensagem);
      caixa.append(aviso);
      setTimeout(() => {
        aviso.classList.add('toast--saindo');
        setTimeout(() => aviso.remove(), 250);
      }, 4200);
      return aviso;
    },

    // Guarda um recado para a PRÓXIMA página (aparece como toast depois do redirecionamento)
    recadoParaProximaTela(mensagem, tipo = 'sucesso') {
      EAP.flash.definir({ tipo, mensagem });
    },

    abrirDialogo(dialogo) {
      if (!dialogo.dataset.pronto) {
        dialogo.dataset.pronto = '1';
        // clique no fundo escuro fecha (o corpo do diálogo ocupa toda a área útil)
        dialogo.addEventListener('click', (ev) => {
          if (ev.target === dialogo) dialogo.close();
        });
      }
      dialogo.showModal();
    },

    fecharDialogo(dialogo) {
      dialogo.close();
    },

    // Devolve uma Promise<boolean>. Ex.: if (await EAP.ui.confirmar({ titulo: 'Excluir?', perigo: true })) …
    confirmar({ titulo = 'Tem certeza?', mensagem = '', confirmar = 'Confirmar', cancelar = 'Cancelar', perigo = false } = {}) {
      return new Promise((resolver) => {
        const idTitulo = 'dlg-confirmar-titulo';
        const botaoSim = el('button', { type: 'button', class: `btn ${perigo ? 'btn--perigo' : 'btn--primario'}` }, confirmar);
        const botaoNao = el('button', { type: 'button', class: 'btn btn--secundario' }, cancelar);
        const dialogo = el(
          'dialog',
          { class: 'dialogo dialogo--confirmar', 'aria-labelledby': idTitulo },
          el(
            'div',
            { class: 'dialogo__corpo' },
            el('h2', { id: idTitulo }, titulo),
            mensagem ? el('p', {}, mensagem) : null,
            el('div', { class: 'dialogo__acoes' }, botaoNao, botaoSim)
          )
        );
        botaoSim.addEventListener('click', () => dialogo.close('sim'));
        botaoNao.addEventListener('click', () => dialogo.close('nao'));
        dialogo.addEventListener('close', () => {
          resolver(dialogo.returnValue === 'sim');
          dialogo.remove();
        });
        document.body.append(dialogo);
        EAP.ui.abrirDialogo(dialogo);
        botaoNao.focus();
      });
    },
  });
})(window);
