jest.mock('../repositories/conteudoRepository', () => ({
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findByIdAndUserId: jest.fn(),
  findAllByMateriaIdAndUserId: jest.fn()
}));

jest.mock('../repositories/materiaRepository', () => ({
  findByIdAndUserId: jest.fn()
}));

const conteudoRepository = require('../repositories/conteudoRepository');
const materiaRepository = require('../repositories/materiaRepository');
const conteudoService = require('../services/conteudoService');
const {
  buildUpdateConteudoInputDto,
  buildCreateConteudoInputDto
} = require('../dtos/conteudoInputDto');

const conteudoExistente = {
  id: 5,
  titulo: 'Crime consumado',
  texto: 'texto original do conteudo',
  materia_id: 10,
  usuario_id: 2,
  created_at: '2026-10-01T00:00:00Z'
};

describe('conteudoService.update', () => {
  test('atualiza titulo e texto do conteudo do proprio usuario', async () => {
    conteudoRepository.findByIdAndUserId.mockResolvedValue(conteudoExistente);
    conteudoRepository.update.mockResolvedValue({
      ...conteudoExistente,
      titulo: 'Crime tentado',
      texto: 'texto revisado do conteudo'
    });

    const output = await conteudoService.update({
      id: 5,
      usuarioId: 2,
      titulo: 'Crime tentado',
      texto: 'texto revisado do conteudo'
    });

    expect(conteudoRepository.findByIdAndUserId).toHaveBeenCalledWith(5, 2);
    expect(conteudoRepository.update).toHaveBeenCalledWith({
      id: 5,
      usuarioId: 2,
      titulo: 'Crime tentado',
      texto: 'texto revisado do conteudo'
    });
    expect(output).toEqual(expect.objectContaining({ id: 5, titulo: 'Crime tentado' }));
  });

  test('devolve 404 quando o conteudo e de outro usuario', async () => {
    conteudoRepository.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      conteudoService.update({ id: 99, usuarioId: 2, titulo: 'T', texto: 'texto com tamanho valido' })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(conteudoRepository.update).not.toHaveBeenCalled();
  });
});

describe('conteudoService.remove', () => {
  test('remove o conteudo do proprio usuario', async () => {
    conteudoRepository.findByIdAndUserId.mockResolvedValue(conteudoExistente);

    await conteudoService.remove({ id: 5, usuarioId: 2 });

    expect(conteudoRepository.remove).toHaveBeenCalledWith(5, 2);
  });

  test('devolve 404 quando o conteudo nao existe', async () => {
    conteudoRepository.findByIdAndUserId.mockResolvedValue(null);

    await expect(conteudoService.remove({ id: 99, usuarioId: 2 })).rejects.toMatchObject({
      statusCode: 404
    });
    expect(conteudoRepository.remove).not.toHaveBeenCalled();
  });
});

describe('conteudoInputDto', () => {
  test('aplica as mesmas regras de texto na criacao e na edicao', () => {
    const curto = { titulo: 'T', texto: 'curto' };

    expect(() => buildCreateConteudoInputDto({ ...curto, materia_id: 1 }, 2)).toThrow(
      expect.objectContaining({ statusCode: 400 })
    );
    expect(() => buildUpdateConteudoInputDto(curto, { id: '5' }, 2)).toThrow(
      expect.objectContaining({ statusCode: 400 })
    );
  });

  test('normaliza e exige id valido na edicao', () => {
    expect(
      buildUpdateConteudoInputDto(
        { titulo: '  Novo titulo  ', texto: '  texto com tamanho mais que suficiente  ' },
        { id: '7' },
        '2'
      )
    ).toEqual({
      id: 7,
      titulo: 'Novo titulo',
      texto: 'texto com tamanho mais que suficiente',
      usuarioId: 2
    });

    expect(() =>
      buildUpdateConteudoInputDto({ titulo: 'T', texto: 'texto suficientemente longo' }, { id: 'abc' }, 2)
    ).toThrow(expect.objectContaining({ statusCode: 400 }));
  });
});

describe('conteudoService.create', () => {
  test('exige que a materia seja do usuario', async () => {
    materiaRepository.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      conteudoService.create({ materiaId: 10, usuarioId: 2, titulo: 'T', texto: 'texto longo o suficiente' })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(conteudoRepository.create).not.toHaveBeenCalled();
  });
});
