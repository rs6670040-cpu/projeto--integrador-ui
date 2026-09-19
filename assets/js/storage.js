/* ==========================================================
   storage.js — "banco de dados" local (localStorage) + dados mockados
   Projeto: Educação ambiental na prática

   Carregado por todas as páginas, ANTES do JS da própria página.
   Tudo fica no namespace global EAP (sem módulos, para funcionar
   também abrindo o index.html direto no navegador).
   ========================================================== */
(function (global) {
  'use strict';

  const EAP = (global.EAP = global.EAP || {});

  const PREFIXO = 'eap:';
  const VERSAO_SEED = 2; // aumente ao adicionar novos usuários mockados (v2: mais alunos, 1 professor e 1 gestor)
  const CHAVES = {
    usuarios: PREFIXO + 'usuarios',
    sessao: PREFIXO + 'sessao',
    seed: PREFIXO + 'seed-versao',
    flash: PREFIXO + 'flash', // recado de uma página para a próxima (sessionStorage)
  };

  /* ---------- Perfis, rotas e listas de opções ---------- */

  // "campo" é o dado extra pedido no cadastro de cada perfil
  EAP.perfis = {
    aluno: {
      rotulo: 'Aluno',
      emoji: '🎒',
      campo: 'ano',
      rotuloCampo: 'Ano escolar',
      opcoes: ['1º ano', '2º ano', '3º ano', '4º ano', '5º ano'],
    },
    professor: {
      rotulo: 'Professor',
      emoji: '🍎',
      campo: 'disciplina',
      rotuloCampo: 'Disciplina ou área',
      opcoes: ['Polivalente (anos iniciais)', 'Ciências', 'Geografia', 'Artes', 'Outra'],
    },
    gestor: {
      rotulo: 'Gestor Escolar',
      emoji: '🏫',
      campo: 'cargo',
      rotuloCampo: 'Cargo',
      opcoes: ['Diretor(a)', 'Vice-diretor(a)', 'Coordenador(a) pedagógico(a)'],
    },
  };

  // Caminhos relativos a partir de qualquer página dentro de /pages/<tela>/
  EAP.rotas = {
    inicio: '../inicio/inicio.html',
    painel: '../painel/painel.html',
    login: {
      aluno: '../login-aluno/login-aluno.html',
      professor: '../login-professor/login-professor.html',
      gestor: '../login-gestor/login-gestor.html',
    },
    cadastro: {
      aluno: '../cadastro-aluno/cadastro-aluno.html',
      professor: '../cadastro-professor/cadastro-professor.html',
      gestor: '../cadastro-gestor/cadastro-gestor.html',
    },
  };

  // Navegação centralizada (facilita testar e trocar o comportamento depois)
  EAP.rotas.ir = (url) => window.location.assign(url);
  EAP.rotas.trocar = (url) => window.location.replace(url); // sem entrada extra no histórico

  // Monta o caminho de uma tela interna, com parâmetros: EAP.rotas.pagina('oficina-detalhe', { id: 'of-1' })
  EAP.rotas.pagina = function (slug, params) {
    const consulta = new URLSearchParams(params || {}).toString();
    return `../${slug}/${slug}.html${consulta ? '?' + consulta : ''}`;
  };

  EAP.escolas = [
    'Escola Municipal Rio Verde',
    'Escola Municipal Girassol',
    'Escola Municipal Sementes do Amanhã',
  ];

  /* ---------- Dados mockados (senha de todos: 123456) ---------- */

  const USUARIOS_MOCK = [
    { id: 'u-mock-aluno-1', perfil: 'aluno', nome: 'Ana Beatriz Souza', email: 'aluno@teste.com', senha: '123456', escola: 'Escola Municipal Rio Verde', ano: '3º ano' },
    { id: 'u-mock-aluno-2', perfil: 'aluno', nome: 'Pedro Henrique Lima', email: 'pedro@teste.com', senha: '123456', escola: 'Escola Municipal Girassol', ano: '5º ano' },
    { id: 'u-mock-aluno-3', perfil: 'aluno', nome: 'Maria Clara Alves', email: 'maria@teste.com', senha: '123456', escola: 'Escola Municipal Rio Verde', ano: '2º ano' },
    { id: 'u-mock-prof-1', perfil: 'professor', nome: 'Marcos Oliveira', email: 'professor@teste.com', senha: '123456', escola: 'Escola Municipal Rio Verde', disciplina: 'Ciências' },
    { id: 'u-mock-prof-2', perfil: 'professor', nome: 'Carla Mendes', email: 'carla@teste.com', senha: '123456', escola: 'Escola Municipal Girassol', disciplina: 'Polivalente (anos iniciais)' },
    { id: 'u-mock-gestor-1', perfil: 'gestor', nome: 'Helena Ribeiro', email: 'gestor@teste.com', senha: '123456', escola: 'Escola Municipal Rio Verde', cargo: 'Diretor(a)' },
    { id: 'u-mock-gestor-2', perfil: 'gestor', nome: 'Roberto Nunes', email: 'roberto@teste.com', senha: '123456', escola: 'Escola Municipal Girassol', cargo: 'Coordenador(a) pedagógico(a)' },
    // Adicionados na versão 2 do seed (dão volume aos relatórios)
    { id: 'u-mock-aluno-4', perfil: 'aluno', nome: 'Lucas Ferreira', email: 'lucas@teste.com', senha: '123456', escola: 'Escola Municipal Girassol', ano: '1º ano' },
    { id: 'u-mock-aluno-5', perfil: 'aluno', nome: 'Sofia Martins', email: 'sofia@teste.com', senha: '123456', escola: 'Escola Municipal Rio Verde', ano: '1º ano' },
    { id: 'u-mock-aluno-6', perfil: 'aluno', nome: 'Davi Costa', email: 'davi@teste.com', senha: '123456', escola: 'Escola Municipal Rio Verde', ano: '2º ano' },
    { id: 'u-mock-aluno-7', perfil: 'aluno', nome: 'Laura Pereira', email: 'laura@teste.com', senha: '123456', escola: 'Escola Municipal Girassol', ano: '3º ano' },
    { id: 'u-mock-aluno-8', perfil: 'aluno', nome: 'Miguel Rocha', email: 'miguel@teste.com', senha: '123456', escola: 'Escola Municipal Rio Verde', ano: '3º ano' },
    { id: 'u-mock-aluno-9', perfil: 'aluno', nome: 'Isabela Barros', email: 'isabela@teste.com', senha: '123456', escola: 'Escola Municipal Girassol', ano: '4º ano' },
    { id: 'u-mock-aluno-10', perfil: 'aluno', nome: 'Arthur Gomes', email: 'arthur@teste.com', senha: '123456', escola: 'Escola Municipal Rio Verde', ano: '4º ano' },
    { id: 'u-mock-aluno-11', perfil: 'aluno', nome: 'Alice Duarte', email: 'alice@teste.com', senha: '123456', escola: 'Escola Municipal Sementes do Amanhã', ano: '5º ano' },
    { id: 'u-mock-aluno-12', perfil: 'aluno', nome: 'Enzo Carvalho', email: 'enzo@teste.com', senha: '123456', escola: 'Escola Municipal Sementes do Amanhã', ano: '5º ano' },
    { id: 'u-mock-aluno-13', perfil: 'aluno', nome: 'Bruno Teixeira', email: 'bruno@teste.com', senha: '123456', escola: 'Escola Municipal Girassol', ano: '3º ano', ativo: false },
    { id: 'u-mock-aluno-14', perfil: 'aluno', nome: 'Manuela Lopes', email: 'manuela@teste.com', senha: '123456', escola: 'Escola Municipal Rio Verde', ano: '1º ano' },
    { id: 'u-mock-aluno-15', perfil: 'aluno', nome: 'Gabriel Nunes', email: 'gabriel@teste.com', senha: '123456', escola: 'Escola Municipal Girassol', ano: '4º ano' },
    { id: 'u-mock-prof-3', perfil: 'professor', nome: 'Patrícia Santos', email: 'patricia@teste.com', senha: '123456', escola: 'Escola Municipal Sementes do Amanhã', disciplina: 'Artes' },
    { id: 'u-mock-gestor-3', perfil: 'gestor', nome: 'Paulo Andrade', email: 'paulo@teste.com', senha: '123456', escola: 'Escola Municipal Sementes do Amanhã', cargo: 'Diretor(a)' },
  ];

  /* ---------- Acesso ao localStorage (com proteção contra bloqueio) ---------- */

  const ler = (chave, padrao) => {
    try {
      const bruto = localStorage.getItem(chave);
      return bruto === null ? padrao : JSON.parse(bruto);
    } catch (e) {
      return padrao;
    }
  };

  const gravar = (chave, valor) => {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (e) {
      return false;
    }
  };

  const remover = (chave) => {
    try {
      localStorage.removeItem(chave);
    } catch (e) {
      /* ignorado */
    }
  };

  // Usado por data.js e por qualquer módulo que precise gravar dados do projeto
  EAP.armazenamento = { ler, gravar, remover, PREFIXO };

  // Alguns navegadores (modo anônimo, política da empresa) bloqueiam o localStorage
  EAP.armazenamentoOk = (() => {
    try {
      const teste = PREFIXO + 'teste';
      localStorage.setItem(teste, '1');
      localStorage.removeItem(teste);
      return true;
    } catch (e) {
      return false;
    }
  })();

  /* ---------- Utilitários ---------- */

  const normalizarEmail = (email) => String(email || '').trim().toLowerCase();
  const normalizarTexto = (texto) => String(texto || '').trim().replace(/\s+/g, ' ');

  // Nunca devolvemos a senha para a interface
  const publico = (usuario) => {
    const { senha, ...resto } = usuario;
    return resto;
  };

  /* ---------- Inicialização e reset ---------- */

  EAP.init = function () {
    if (!EAP.armazenamentoOk) return;
    if (ler(CHAVES.seed, 0) >= VERSAO_SEED) return;

    const usuarios = ler(CHAVES.usuarios, []);
    USUARIOS_MOCK.forEach((mock) => {
      if (!usuarios.some((u) => u.email === mock.email)) {
        usuarios.push({ ...mock, criadoEm: '2026-03-02T10:00:00.000Z' });
      }
    });
    gravar(CHAVES.usuarios, usuarios);
    gravar(CHAVES.seed, VERSAO_SEED);
  };

  // Apaga tudo do projeto (eap:*) e recria os dados de teste
  EAP.resetar = function () {
    try {
      Object.keys(localStorage)
        .filter((chave) => chave.startsWith(PREFIXO))
        .forEach((chave) => localStorage.removeItem(chave));
      sessionStorage.removeItem(CHAVES.flash);
    } catch (e) {
      /* ignorado */
    }
    EAP.init(); // data.js, quando carregado, acrescenta o seed das demais coleções
  };

  /* ---------- Usuários ---------- */

  EAP.usuarios = {
    listar() {
      return ler(CHAVES.usuarios, []);
    },

    // Versão segura para a interface: nunca inclui a senha
    listarPublico() {
      return this.listar().map(publico);
    },

    obterPublico(id) {
      const u = this.listar().find((x) => x.id === id);
      return u ? publico(u) : null;
    },

    buscarPorEmail(email) {
      const alvo = normalizarEmail(email);
      return this.listar().find((u) => u.email === alvo) || null;
    },

    criar(dados) {
      const perfil = EAP.perfis[dados.perfil];
      if (!perfil) return { ok: false, erro: 'Perfil inválido.' };

      const email = normalizarEmail(dados.email);
      if (this.buscarPorEmail(email)) {
        return { ok: false, campo: 'email', erro: 'Este e-mail já está cadastrado. Tente entrar.' };
      }

      const usuario = {
        id: 'u-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        perfil: dados.perfil,
        nome: normalizarTexto(dados.nome),
        email,
        senha: dados.senha, // protótipo: em texto puro. Com back-end, use hash (bcrypt/argon2).
        escola: normalizarTexto(dados.escola),
        [perfil.campo]: dados[perfil.campo],
        ativo: dados.ativo !== false,
        criadoEm: new Date().toISOString(),
      };

      const lista = this.listar();
      lista.push(usuario);
      if (!gravar(CHAVES.usuarios, lista)) {
        return { ok: false, erro: 'Não foi possível salvar o cadastro. O armazenamento do navegador está bloqueado.' };
      }
      return { ok: true, usuario: publico(usuario) };
    },

    // mudancas: nome, escola, ano/disciplina/cargo, ativo, senha. Perfil e e-mail não mudam aqui.
    atualizar(id, mudancas) {
      const lista = this.listar();
      const i = lista.findIndex((u) => u.id === id);
      if (i < 0) return { ok: false, erro: 'Usuário não encontrado.' };
      const permitidos = ['nome', 'escola', 'ano', 'disciplina', 'cargo', 'ativo', 'senha'];
      permitidos.forEach((campo) => {
        if (mudancas[campo] !== undefined) lista[i][campo] = campo === 'nome' || campo === 'escola' ? normalizarTexto(mudancas[campo]) : mudancas[campo];
      });
      if (!gravar(CHAVES.usuarios, lista)) return { ok: false, erro: 'Não foi possível salvar.' };
      return { ok: true, usuario: publico(lista[i]) };
    },

    remover(id) {
      const lista = this.listar();
      const restante = lista.filter((u) => u.id !== id);
      if (restante.length === lista.length) return false;
      gravar(CHAVES.usuarios, restante);
      const sessao = ler(CHAVES.sessao, null);
      if (sessao && sessao.id === id) remover(CHAVES.sessao);
      return true;
    },
  };

  /* ---------- Autenticação (sessão) ---------- */

  EAP.auth = {
    // perfilEsperado: perfil da tela de login em uso (aluno, professor ou gestor)
    entrar(email, senha, perfilEsperado) {
      const usuario = EAP.usuarios.buscarPorEmail(email);

      // Mesma mensagem para e-mail inexistente e senha errada (não revela quais e-mails existem)
      if (!usuario || usuario.senha !== senha) {
        return { ok: false, erro: 'E-mail ou senha incorretos.' };
      }

      if (usuario.ativo === false) {
        return { ok: false, erro: 'Sua conta está desativada. Procure a gestão da escola.' };
      }

      // Credenciais certas, mas o usuário está na porta do perfil errado
      if (perfilEsperado && usuario.perfil !== perfilEsperado) {
        return {
          ok: false,
          erro: `Este e-mail está cadastrado como ${EAP.perfis[usuario.perfil].rotulo}.`,
          perfilCorreto: usuario.perfil,
        };
      }

      gravar(CHAVES.sessao, { id: usuario.id, entrouEm: new Date().toISOString() });
      return { ok: true, usuario: publico(usuario) };
    },

    sair() {
      remover(CHAVES.sessao);
    },

    usuarioLogado() {
      const sessao = ler(CHAVES.sessao, null);
      if (!sessao || !sessao.id) return null;
      const usuario = EAP.usuarios.listar().find((u) => u.id === sessao.id);
      if (!usuario) {
        remover(CHAVES.sessao);
        return null;
      }
      return publico(usuario);
    },

    // Use no topo de páginas protegidas. Devolve o usuário ou redireciona.
    // perfisPermitidos (opcional): ex. ['professor']. Outro perfil volta para o painel.
    // Atenção: em um sistema só de front-end isso organiza a navegação, não é segurança.
    exigirLogin(perfisPermitidos) {
      const usuario = this.usuarioLogado();
      if (!usuario || usuario.ativo === false) {
        this.sair();
        EAP.rotas.trocar(EAP.rotas.inicio);
        return null;
      }
      if (perfisPermitidos && !perfisPermitidos.includes(usuario.perfil)) {
        EAP.rotas.trocar(EAP.rotas.painel);
        return null;
      }
      return usuario;
    },
  };

  /* ---------- Recado entre páginas (ex.: "Cadastro realizado!") ---------- */

  EAP.flash = {
    definir(recado) {
      try {
        sessionStorage.setItem(CHAVES.flash, JSON.stringify(recado));
      } catch (e) {
        /* ignorado */
      }
    },
    ler() {
      try {
        const bruto = sessionStorage.getItem(CHAVES.flash);
        if (!bruto) return null;
        sessionStorage.removeItem(CHAVES.flash);
        return JSON.parse(bruto);
      } catch (e) {
        return null;
      }
    },
  };

  EAP.normalizarTexto = normalizarTexto;

  EAP.init();
})(window);
