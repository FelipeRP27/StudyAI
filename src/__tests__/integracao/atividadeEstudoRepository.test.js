const db = require('../../config/database');
const atividadeEstudoRepository = require('../../repositories/atividadeEstudoRepository');
const { limparBanco, criarUsuario, criarMateria, criarConteudo } = require('./fixtures');

describe('atividadeEstudoRepository (banco real)', () => {
  let usuarioId;
  let conteudoId;

  beforeEach(async () => {
    await limparBanco();
    usuarioId = await criarUsuario();
    const materiaId = await criarMateria(usuarioId);
    conteudoId = await criarConteudo(usuarioId, materiaId);
  });

  afterAll(async () => {
    await db.pool.end();
  });

  test('registra a atividade e respeita a janela entre registros', async () => {
    const primeira = await atividadeEstudoRepository.registrar({
      usuarioId,
      conteudoId,
      tipo: 'resumo',
      minutosEntreRegistros: 30
    });

    const repetida = await atividadeEstudoRepository.registrar({
      usuarioId,
      conteudoId,
      tipo: 'resumo',
      minutosEntreRegistros: 30
    });

    const outroTipo = await atividadeEstudoRepository.registrar({
      usuarioId,
      conteudoId,
      tipo: 'questoes',
      minutosEntreRegistros: 30
    });

    expect(primeira).toEqual(expect.objectContaining({ tipo: 'resumo', conteudo_id: conteudoId }));
    expect(repetida).toBeNull();
    expect(outroTipo).toEqual(expect.objectContaining({ tipo: 'questoes' }));

    const { rows } = await db.query('SELECT COUNT(*)::int AS total FROM atividades_estudo');
    expect(rows[0].total).toBe(2);
  });

  test('registra de novo quando a janela ja passou', async () => {
    await atividadeEstudoRepository.registrar({
      usuarioId,
      conteudoId,
      tipo: 'flashcards',
      minutosEntreRegistros: 30
    });
    await db.query("UPDATE atividades_estudo SET created_at = NOW() - INTERVAL '2 hours'");

    const nova = await atividadeEstudoRepository.registrar({
      usuarioId,
      conteudoId,
      tipo: 'flashcards',
      minutosEntreRegistros: 30
    });

    expect(nova).not.toBeNull();
  });

  test('resume a ultima atividade por conteudo', async () => {
    await atividadeEstudoRepository.registrar({
      usuarioId,
      conteudoId,
      tipo: 'conteudo',
      minutosEntreRegistros: 30
    });
    await atividadeEstudoRepository.registrar({
      usuarioId,
      conteudoId,
      tipo: 'resumo',
      minutosEntreRegistros: 30
    });

    const [resumo] = await atividadeEstudoRepository.findUltimaPorConteudo(usuarioId);
    const ultima = await atividadeEstudoRepository.findUltimaDoConteudo({ usuarioId, conteudoId });

    expect(resumo).toEqual(
      expect.objectContaining({ conteudo_id: conteudoId, total_atividades: 2 })
    );
    expect(ultima.tipo).toBe('resumo');
  });

  test('nao enxerga atividade de outro usuario', async () => {
    const outro = await criarUsuario('Outro aluno');
    await atividadeEstudoRepository.registrar({
      usuarioId,
      conteudoId,
      tipo: 'resumo',
      minutosEntreRegistros: 30
    });

    expect(await atividadeEstudoRepository.findUltimaPorConteudo(outro)).toEqual([]);
  });
});
