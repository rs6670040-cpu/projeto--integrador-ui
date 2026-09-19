/* Detalhe da oficina: informações, materiais e passo a passo com progresso (RF08) */
(function () {
  'use strict';
  const usuario = EAP.shell.montar({ secao: 'oficinas', perfis: ['aluno', 'professor'] });
  if (!usuario) return;

  const { el, $ } = EAP.dom;
  const D = EAP.dados;
  const ehAluno = usuario.perfil === 'aluno';
  const id = EAP.util.parametros().get('id');

  const inicial = D.oficinas.obter(id);
  if (!inicial || (inicial.status === 'rascunho' && inicial.professorId !== usuario.id)) {
    EAP.shell.redirecionar(EAP.rotas.pagina('oficinas'), 'Essa oficina não está disponível.');
    return;
  }
  document.title = `${inicial.titulo} – Educação ambiental na prática`;

  const conteudo = $('#conteudo');
  const professor = EAP.usuarios.obterPublico(inicial.professorId);
  let editandoAvaliacao = false;

  const quantidadePorAluno = (q) => (q >= 1 ? `${EAP.fmt.numero(q)} por aluno` : `1 para cada ${Math.round(1 / q)} alunos`);

  /* ----- Ações ----- */
  function participar() {
    const r = D.inscrever(id, usuario.id);
    if (!r.ok) { EAP.ui.toast(r.erro, 'erro'); renderizar(); return; }
    EAP.ui.toast('Você entrou na oficina! Marque os passos conforme for fazendo.');
    renderizar('passos-titulo');
  }

  async function sair() {
    const ok = await EAP.ui.confirmar({ titulo: 'Sair da oficina?', mensagem: 'Seu progresso nesta oficina será apagado e a vaga volta para a turma.', confirmar: 'Sair da oficina', perigo: true });
    if (!ok) return;
    D.cancelarInscricao(id, usuario.id);
    EAP.ui.toast('Você saiu da oficina.', 'info');
    editandoAvaliacao = false;
    renderizar();
  }

  function alternarPasso(insc, passoId, feito) {
    const antes = insc.concluida;
    const r = D.marcarPasso(insc.id, passoId, feito);
    if (!r.ok) { EAP.ui.toast(r.erro, 'erro'); return; }
    if (!antes && r.inscricao.concluida) EAP.ui.toast('🎉 Você concluiu a oficina! Conte o que achou.');
    renderizar(`passo-${passoId}`);
  }

  function enviarAvaliacao(ev, insc) {
    ev.preventDefault();
    const marcada = ev.target.querySelector('input[name="nota"]:checked');
    const erro = ev.target.querySelector('.campo__erro');
    if (!marcada) { erro.textContent = 'Escolha de 1 a 5 estrelas.'; return; }
    const r = D.avaliarInscricao(insc.id, Number(marcada.value), ev.target.querySelector('textarea').value);
    if (!r.ok) { EAP.ui.toast(r.erro, 'erro'); return; }
    editandoAvaliacao = false;
    EAP.ui.toast('Obrigado pela avaliação!');
    renderizar('avaliacao-titulo');
  }

  /* ----- Blocos ----- */
  function blocoAvaliacao(insc) {
    const titulo = el('h2', { id: 'avaliacao-titulo', tabindex: '-1' }, '🎉 Oficina concluída!');
    if (insc.nota && !editandoAvaliacao) {
      return el(
        'section',
        { class: 'avaliacao' },
        titulo,
        el('div', { class: 'avaliacao__nota' }, EAP.comp.estrelas(insc.nota), el('span', { class: 'texto-suave', style: 'font-size:1rem' }, 'Sua avaliação')),
        insc.comentario ? el('p', {}, `"${insc.comentario}"`) : null,
        el('div', { class: 'acoes' }, el('button', { type: 'button', class: 'btn btn--secundario btn--pequeno', onclick: () => { editandoAvaliacao = true; renderizar('avaliacao-titulo'); } }, 'Alterar avaliação'))
      );
    }
    return el(
      'section',
      { class: 'avaliacao' },
      titulo,
      el(
        'form',
        { novalidate: true, onsubmit: (ev) => enviarAvaliacao(ev, insc) },
        el(
          'fieldset',
          {},
          el('legend', {}, 'Como foi a oficina?'),
          el(
            'div',
            { class: 'opcoes' },
            [1, 2, 3, 4, 5].map((n) => el('label', { class: 'opcao' }, el('input', { type: 'radio', name: 'nota', value: String(n), checked: insc.nota === n }), `${n} ${n === 1 ? 'estrela' : 'estrelas'}`))
          ),
          el('p', { class: 'campo__erro', 'aria-live': 'polite' })
        ),
        el('div', { class: 'campo', style: 'margin-top:12px' }, el('label', { for: 'comentario' }, 'Quer contar mais? (opcional)'), el('textarea', { id: 'comentario', maxlength: '300', rows: '2', placeholder: 'O que você mais gostou?' }, insc.comentario || '')),
        el('div', { class: 'acoes' }, el('button', { type: 'submit', class: 'btn btn--primario btn--pequeno' }, 'Enviar avaliação'))
      )
    );
  }

  function blocoPassos(o, insc) {
    const podeMarcar = ehAluno && !!insc;
    const total = o.passos.length;
    const p = insc ? D.progressoDaInscricao(insc, o) : null;
    return el(
      'section',
      {},
      el('h2', { id: 'passos-titulo', tabindex: '-1' }, 'Passo a passo'),
      el(
        'div',
        { class: 'passos__topo' },
        p ? EAP.comp.barra(p.pct, 'Seu progresso na oficina') : null,
        ehAluno && !insc ? el('p', { class: 'texto-suave' }, o.status === 'aberta' ? 'Você pode ler os passos agora. Participe da oficina para marcar o seu progresso.' : 'Esta oficina foi encerrada, mas você ainda pode ler os passos.') : null,
        ehAluno && insc && !insc.concluida ? el('p', { class: 'texto-suave' }, 'Marque cada passo quando terminar. Em caso de dúvida, chame o professor.') : null
      ),
      el(
        'ol',
        { class: 'passos' },
        o.passos.map((passo) => {
          const feito = !!insc && (insc.concluida || (insc.passosConcluidos || []).includes(passo.id));
          const texto = el('span', { class: 'passo__texto' }, el('strong', {}, passo.titulo), el('span', {}, passo.descricao));
          return el(
            'li',
            { class: 'passo' + (feito ? ' passo--feito' : '') },
            podeMarcar
              ? el('label', { class: 'passo__label', for: `passo-${passo.id}` }, el('input', { type: 'checkbox', id: `passo-${passo.id}`, checked: feito, onchange: (ev) => alternarPasso(insc, passo.id, ev.target.checked) }), texto)
              : el('div', { class: 'passo__label' }, texto)
          );
        })
      ),
      total === 0 ? el('p', { class: 'texto-suave' }, 'Esta oficina ainda não tem passos cadastrados.') : null
    );
  }

  function aside(o, insc, vagas, dono) {
    const anos = (o.anos || []).length === 5 ? 'Todos os anos' : (o.anos || []).join(', ');
    let cta;
    if (ehAluno) {
      if (insc) {
        cta = el('div', { class: 'acoes' }, EAP.comp.chipStatusInscricao(D.statusDaInscricao(insc)), el('button', { type: 'button', class: 'btn btn--secundario-perigo btn--pequeno', onclick: sair }, 'Sair da oficina'));
      } else if (o.status === 'aberta' && vagas > 0) {
        cta = el('button', { type: 'button', class: 'btn btn--primario btn--bloco', onclick: participar }, 'Participar da oficina');
      } else {
        cta = el('p', { class: 'cartao__texto' }, o.status === 'aberta' ? 'Não há mais vagas nesta oficina.' : 'As inscrições desta oficina estão encerradas.');
      }
    } else if (dono) {
      cta = el(
        'div',
        { class: 'acoes' },
        el('a', { class: 'btn btn--primario btn--pequeno', href: EAP.rotas.pagina('oficina-form', { id: o.id }) }, 'Editar oficina'),
        el('a', { class: 'btn btn--secundario btn--pequeno', href: EAP.rotas.pagina('participacao', { oficina: o.id }) }, 'Ver participantes')
      );
    } else {
      cta = el('p', { class: 'cartao__texto' }, 'Você está vendo a oficina de outro professor.');
    }

    return el(
      'aside',
      { class: 'oficina-aside cartao', 'aria-label': 'Informações da oficina' },
      el('h2', {}, 'Informações'),
      el(
        'dl',
        { class: 'info' },
        el('div', {}, el('dt', {}, 'Data'), el('dd', {}, `${EAP.fmt.diaSemana(o.data)}, ${EAP.fmt.data(o.data)}${o.horario ? ' às ' + o.horario : ''}`)),
        el('div', {}, el('dt', {}, 'Local'), el('dd', {}, o.local || '—')),
        el('div', {}, el('dt', {}, 'Duração'), el('dd', {}, EAP.fmt.duracao(o.duracaoMin))),
        el('div', {}, el('dt', {}, 'Para'), el('dd', {}, anos || '—')),
        el('div', {}, el('dt', {}, 'Vagas'), el('dd', {}, o.status === 'aberta' ? `${vagas} de ${o.vagas} livres` : `${D.inscritosDaOficina(o.id).length} participantes`)),
        el('div', {}, el('dt', {}, 'Professor(a)'), el('dd', {}, professor ? professor.nome : '—'))
      ),
      cta
    );
  }

  /* ----- Página ----- */
  function renderizar(focoId) {
    const o = D.oficinas.obter(id);
    const insc = ehAluno ? D.inscricaoDoAluno(id, usuario.id) : null;
    const vagas = D.vagasRestantes(o);
    const dono = !ehAluno && o.professorId === usuario.id;
    const materiais = D.materiais.listar();

    EAP.dom.montar(
      conteudo,
      el(
        'header',
        { class: 'oficina-topo' },
        el('span', { class: 'oficina-topo__figura', 'aria-hidden': 'true' }, o.emoji),
        el('div', {}, el('div', { class: 'chips' }, EAP.comp.chipStatusOficina(o.status), EAP.comp.chip(`Dificuldade: ${EAP.dificuldades[o.dificuldade] || '—'}`, 'info')), el('h1', {}, o.titulo), el('p', {}, o.descricao))
      ),
      o.status === 'rascunho' && dono
        ? el('div', { class: 'aviso', style: 'margin-bottom:24px' }, el('span', { class: 'aviso__icone', 'aria-hidden': 'true' }, '📝'), el('div', {}, el('strong', {}, 'Esta oficina é um rascunho'), el('p', {}, 'Só você consegue ver. Mude a situação para "Inscrições abertas" quando estiver pronta.')))
        : null,
      el(
        'div',
        { class: 'oficina-layout' },
        el(
          'div',
          { class: 'oficina-principal' },
          o.objetivo ? el('section', {}, el('h2', {}, 'O que vamos aprender'), el('p', {}, o.objetivo)) : null,
          el(
            'section',
            {},
            el('h2', {}, 'Materiais'),
            el(
              'ul',
              { class: 'materiais-lista' },
              (o.materiais || []).map((item) => {
                const m = materiais.find((x) => x.id === item.materialId);
                if (!m) return null;
                return el('li', {}, el('a', { href: EAP.rotas.pagina('sugestoes', { material: m.id }) }, `${m.emoji} ${m.nome}`, el('small', {}, quantidadePorAluno(item.porAluno))));
              })
            )
          ),
          o.cuidados ? el('div', { class: 'aviso' }, el('span', { class: 'aviso__icone', 'aria-hidden': 'true' }, '⚠️'), el('div', {}, el('strong', {}, 'Cuidados'), el('p', {}, o.cuidados))) : null,
          blocoPassos(o, insc),
          insc && insc.concluida ? blocoAvaliacao(insc) : null
        ),
        aside(o, insc, vagas, dono)
      )
    );
    if (focoId) {
      const alvo = document.getElementById(focoId);
      if (alvo) alvo.focus();
    }
  }

  renderizar();
})();
