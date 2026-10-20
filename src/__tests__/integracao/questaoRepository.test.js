const db = require('../../config/database');
const questaoRepository = require('../../repositories/questaoRepository');
const {
  limparBanco,
  criarUsuario,
  criarMateria,
  criarConteudo,
  criarQuestao,
  responder
} = require('./fixtures');

describe('questaoRepository (banco real)', () => {
  let usuarioId;
  let materiaId;
  let conteudoId;

  beforeEach(async () => {
    await limparBanco();
    usuarioId = await criarUsuario();
    materiaId = await criarMateria(usuarioId);
    conteudoId = await criarConteudo(usuarioId, materiaId);
  });

  afterAll(async () => {
    await db.pool.end();
  });

  describe('sessao por conteudo', () => {
    test('prioriza inedita, depois erro pendente, depois mais erros', async () => {
      const inedita = await criarQuestao(conteudoId, { enunciado: 'Inedita' });
      const pendente = await criarQuestao(conteudoId, { enunciado: 'Pendente' });
      const muitosErros = await criarQuestao(conteudoId, { enunciado: 'Muitos erros' });
      const dominada = await criarQuestao(conteudoId, { enunciado: 'Dominada' });

      await responder(usuarioId, pendente, false, { diasAtras: 1 });

      await responder(usuarioId, muitosErros, false, { diasAtras: 5 });
      await responder(usuarioId, muitosErros, false, { diasAtras: 4 });
      await responder(usuarioId, muitosErros, true, { diasAtras: 3 });

      await responder(usuarioId, dominada, true, { diasAtras: 2 });

      const linhas = await questaoRepository.findParaSessaoPorConteudo({
        conteudoId,
        usuarioId,
        limite: 10
      });

      expect(linhas.map((l) => l.enunciado)).toEqual([
        'Inedita',
        'Pendente',
        'Muitos erros',
        'Dominada'
      ]);
      expect(linhas[0]).toEqual(
        expect.objectContaining({
          total_respostas: 0,
          total_erros: 0,
          ultima_resposta_em: null,
          ultima_resposta_correta: null
        })
      );
      expect(linhas[2]).toEqual(
        expect.objectContaining({ total_respostas: 3, total_erros: 2, ultima_resposta_correta: true })
      );
      expect(linhas[0].id).toBe(inedita.id);
    });

    test('desempata questoes equivalentes pela resposta mais antiga', async () => {
      const antiga = await criarQuestao(conteudoId, { enunciado: 'Vista ha mais tempo' });
      const recente = await criarQuestao(conteudoId, { enunciado: 'Vista ontem' });

      await responder(usuarioId, antiga, true, { diasAtras: 20 });
      await responder(usuarioId, recente, true, { diasAtras: 1 });

      const linhas = await questaoRepository.findParaSessaoPorConteudo({
        conteudoId,
        usuarioId,
        limite: 10
      });

      expect(linhas.map((l) => l.enunciado)).toEqual(['Vista ha mais tempo', 'Vista ontem']);
    });

    test('respeita o limite e ignora o historico de outro usuario', async () => {
      const primeira = await criarQuestao(conteudoId, { enunciado: 'Primeira' });
      await criarQuestao(conteudoId, { enunciado: 'Segunda' });

      const outroUsuario = await criarUsuario('Outro');
      await responder(outroUsuario, primeira, false, { diasAtras: 1 });

      const linhas = await questaoRepository.findParaSessaoPorConteudo({
        conteudoId,
        usuarioId,
        limite: 1
      });

      expect(linhas).toHaveLength(1);
      expect(linhas[0].total_respostas).toBe(0);
    });
  });

  describe('diagnostico', () => {
    test('alterna entre conteudos em vez de esgotar um so', async () => {
      const outroConteudo = await criarConteudo(usuarioId, materiaId, 'Licitacoes');

      await criarQuestao(conteudoId, { enunciado: 'Atos 1' });
      await criarQuestao(conteudoId, { enunciado: 'Atos 2' });
      await criarQuestao(conteudoId, { enunciado: 'Atos 3' });
      await criarQuestao(outroConteudo, { enunciado: 'Licitacoes 1' });
      await criarQuestao(outroConteudo, { enunciado: 'Licitacoes 2' });

      const linhas = await questaoRepository.findParaDiagnostico({ usuarioId, limite: 4 });

      expect(linhas.map((l) => l.enunciado)).toEqual([
        'Atos 1',
        'Licitacoes 1',
        'Atos 2',
        'Licitacoes 2'
      ]);
      expect(linhas[0]).toEqual(
        expect.objectContaining({
          conteudo_titulo: 'Atos Administrativos',
          materia_id: materiaId,
          materia_nome: 'Direito Administrativo'
        })
      );
    });

    test('so traz questoes nunca respondidas pelo usuario', async () => {
      const respondida = await criarQuestao(conteudoId, { enunciado: 'Ja respondida' });
      await criarQuestao(conteudoId, { enunciado: 'Nunca vista' });
      await responder(usuarioId, respondida, true, { diasAtras: 1 });

      const linhas = await questaoRepository.findParaDiagnostico({ usuarioId, limite: 10 });

      expect(linhas.map((l) => l.enunciado)).toEqual(['Nunca vista']);
    });

    test('prefere conteudos com menos respostas acumuladas', async () => {
      const conhecido = await criarConteudo(usuarioId, materiaId, 'Conteudo ja estudado');
      const novo = await criarConteudo(usuarioId, materiaId, 'Conteudo novo');

      const jaRespondida = await criarQuestao(conhecido, { enunciado: 'Conhecida' });
      await criarQuestao(conhecido, { enunciado: 'Do conteudo conhecido' });
      await criarQuestao(novo, { enunciado: 'Do conteudo novo' });

      await responder(usuarioId, jaRespondida, true, { diasAtras: 1 });
      await responder(usuarioId, jaRespondida, false, { diasAtras: 2 });

      const linhas = await questaoRepository.findParaDiagnostico({ usuarioId, limite: 2 });

      expect(linhas.map((l) => l.enunciado)).toEqual([
        'Do conteudo novo',
        'Do conteudo conhecido'
      ]);
    });

    test('nao vaza questoes de outro usuario', async () => {
      await criarQuestao(conteudoId, { enunciado: 'Minha' });

      const outroUsuario = await criarUsuario('Outro');
      const outraMateria = await criarMateria(outroUsuario, 'Portugues');
      const conteudoAlheio = await criarConteudo(outroUsuario, outraMateria, 'Crase');
      await criarQuestao(conteudoAlheio, { enunciado: 'Alheia' });

      const linhas = await questaoRepository.findParaDiagnostico({ usuarioId, limite: 10 });

      expect(linhas.map((l) => l.enunciado)).toEqual(['Minha']);
    });
  });

  test('busca por id valida o dono atraves do conteudo', async () => {
    const questao = await criarQuestao(conteudoId, { enunciado: 'Minha questao' });
    const outroUsuario = await criarUsuario('Outro');

    expect(await questaoRepository.findByIdAndUserId(questao.id, usuarioId)).toEqual(
      expect.objectContaining({ enunciado: 'Minha questao', conteudo_id: conteudoId })
    );
    expect(await questaoRepository.findByIdAndUserId(questao.id, outroUsuario)).toBeNull();
  });

  test('lista questoes sem assunto para o script de classificacao', async () => {
    await criarQuestao(conteudoId, { enunciado: 'Sem assunto' });
    await criarQuestao(conteudoId, { enunciado: 'Com assunto', assunto: 'Anulacao' });

    const conteudos = await questaoRepository.findConteudosComQuestoesSemAssunto();
    expect(conteudos).toEqual([expect.objectContaining({ id: conteudoId })]);

    const [pendente] = await questaoRepository.findSemAssuntoByConteudoId(conteudoId);
    expect(pendente.enunciado).toBe('Sem assunto');

    await questaoRepository.updateAssunto({ id: pendente.id, assunto: 'Revogacao' });

    expect(await questaoRepository.findSemAssuntoByConteudoId(conteudoId)).toEqual([]);
    expect(await questaoRepository.findConteudosComQuestoesSemAssunto()).toEqual([]);
  });

  test('alternativas vem na ordem de criacao', async () => {
    const questao = await questaoRepository.create({
      conteudoId,
      enunciado: 'Qual a alternativa correta?',
      assunto: 'Anulacao'
    });

    const criadas = [];
    for (const texto of ['Primeira', 'Segunda', 'Terceira']) {
      criadas.push(
        await questaoRepository.createAlternativa({
          questaoId: questao.id,
          texto,
          isCorreta: texto === 'Segunda',
          justificativa: `justificativa de ${texto}`
        })
      );
    }

    const alternativas = await questaoRepository.findAlternativasByQuestaoIds([questao.id]);

    expect(alternativas.map((a) => a.texto)).toEqual(['Primeira', 'Segunda', 'Terceira']);
    expect(alternativas.filter((a) => a.is_correta)).toHaveLength(1);
    expect(alternativas[1].justificativa).toBe('justificativa de Segunda');
    expect(criadas).toHaveLength(3);
  });

  test('lista vazia de ids nao vai ao banco', async () => {
    expect(await questaoRepository.findAlternativasByQuestaoIds([])).toEqual([]);
  });
});
