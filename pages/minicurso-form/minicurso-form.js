/* Cadastro e edição de conteúdo (minicurso) — só professor */
(function () {
  'use strict';
  const usuario = EAP.shell.montar({ secao: 'minicursos', perfis: ['professor'] });
  if (!usuario) return;

  const { el, $ } = EAP.dom;
  const D = EAP.dados;
  const idEdicao = EAP.util.parametros().get('id');
  const existente = idEdicao ? D.minicursos.obter(idEdicao) : null;

  if (idEdicao && !existente) { EAP.shell.redirecionar(EAP.rotas.pagina('minicursos'), 'Esse conteúdo não existe mais.'); return; }
  if (existente && existente.professorId !== usuario.id) { EAP.shell.redirecionar(EAP.rotas.pagina('minicursos'), 'Só quem criou o conteúdo pode editá-lo.'); return; }

  const emojis = [...EAP.emojisMinicurso];
  if (existente && !emojis.includes(existente.emoji)) emojis.unshift(existente.emoji);
  emojis.forEach((e) => $('#emoji').append(el('option', { value: e }, e)));

  const aulas = EAP.comp.listaDinamica({
    container: $('#aulas'),
    rotuloItem: 'Aula',
    textoAdicionar: 'Adicionar aula',
    minimo: 1,
    campos: [
      { chave: 'titulo', rotulo: 'Título da aula', obrigatorio: true, atributos: { maxlength: 70 } },
      { chave: 'tipo', rotulo: 'Tipo', tipo: 'select', padrao: 'texto', opcoes: [{ valor: 'texto', rotulo: 'Texto' }, { valor: 'imagem', rotulo: 'Imagem' }, { valor: 'video', rotulo: 'Vídeo (YouTube)' }] },
      { chave: 'url', rotulo: 'Link da imagem ou do vídeo', visivelSe: (v) => v.tipo !== 'texto', placeholder: 'https://…', atributos: { list: 'imagens-biblioteca' } },
      { chave: 'conteudo', rotulo: 'Texto da aula (ou legenda da imagem/vídeo)', tipo: 'textarea', linhas: 4, atributos: { maxlength: 2000 } },
    ],
    // Regras que dependem do tipo da aula
    validarItem: (v) => {
      if (v.tipo === 'texto') return v.conteudo ? {} : { conteudo: 'Escreva o texto da aula.' };
      if (!v.url) return { url: 'Cole o link.' };
      if (v.tipo === 'video') return EAP.util.youtubeId(v.url) || EAP.util.urlSegura(v.url) ? {} : { url: 'Use um link do YouTube (https://…).' };
      return EAP.util.urlSegura(v.url, { imagem: true }) ? {} : { url: 'Use um link https:// ou escolha uma imagem da biblioteca.' };
    },
    itens: existente ? existente.aulas : [],
  });

  if (existente) {
    $('#titulo').textContent = 'Editar conteúdo';
    document.title = 'Editar conteúdo – Educação ambiental na prática';
    $('#titulo-curso').value = existente.titulo;
    $('#emoji').value = existente.emoji;
    $('#descricao').value = existente.descricao;
    $('#publicado').value = existente.publicado ? 'sim' : 'nao';
    $('#btn-excluir').hidden = false;
  }

  $('#form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    ['titulo-curso', 'descricao'].forEach((i) => EAP.ui.limparErroCampo($('#' + i)));
    const titulo = $('#titulo-curso').value.trim();
    const descricao = $('#descricao').value.trim();
    let primeiro = null;
    if (titulo.length < 3) { EAP.ui.erroCampo($('#titulo-curso'), 'Dê um título ao conteúdo.'); primeiro = $('#titulo-curso'); }
    if (descricao.length < 10) { EAP.ui.erroCampo($('#descricao'), 'Descreva o conteúdo com pelo menos 10 letras.'); primeiro = primeiro || $('#descricao'); }
    const aulasOk = aulas.validar();
    if (primeiro) { primeiro.focus(); return; }
    if (!aulasOk) return;

    const dados = {
      titulo, descricao,
      emoji: $('#emoji').value,
      publicado: $('#publicado').value === 'sim',
      aulas: aulas.obter().map((a) => ({ id: a.id || D.novoId('a'), titulo: a.titulo, tipo: a.tipo, url: a.tipo === 'texto' ? '' : a.url, conteudo: a.conteudo })),
    };
    const salvo = existente ? D.minicursos.atualizar(existente.id, dados) : D.minicursos.criar({ ...dados, professorId: usuario.id });
    if (!salvo) { EAP.ui.toast('Não foi possível salvar.', 'erro'); return; }
    EAP.ui.recadoParaProximaTela(existente ? 'Conteúdo atualizado.' : 'Conteúdo criado.');
    EAP.rotas.ir(EAP.rotas.pagina('minicursos'));
  });

  $('#btn-excluir').addEventListener('click', async () => {
    const ok = await EAP.ui.confirmar({ titulo: `Excluir "${existente.titulo}"?`, mensagem: 'O progresso dos alunos neste conteúdo também será apagado.', confirmar: 'Excluir', perigo: true });
    if (!ok) return;
    D.removerMinicurso(existente.id);
    EAP.ui.recadoParaProximaTela('Conteúdo excluído.');
    EAP.rotas.ir(EAP.rotas.pagina('minicursos'));
  });
})();
