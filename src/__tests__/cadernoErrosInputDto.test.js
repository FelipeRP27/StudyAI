const { buildListarErrosInputDto } = require('../dtos/cadernoErrosInputDto');

describe('cadernoErrosInputDto.buildListarErrosInputDto', () => {
  test('converte filtros opcionais e ignora valores vazios', () => {
    expect(buildListarErrosInputDto({ materia_id: '3', conteudo_id: '', status: 'pendente' }, '9')).toEqual({
      usuarioId: 9,
      materiaId: 3,
      conteudoId: null,
      status: 'pendente'
    });
    expect(buildListarErrosInputDto({}, 9)).toEqual({
      usuarioId: 9,
      materiaId: null,
      conteudoId: null,
      status: null
    });
  });

  test('rejeita status desconhecido e ids invalidos com 400', () => {
    expect(() => buildListarErrosInputDto({ status: 'arquivado' }, 9)).toThrow(
      expect.objectContaining({ statusCode: 400 })
    );
    expect(() => buildListarErrosInputDto({ materia_id: 'abc' }, 9)).toThrow(
      expect.objectContaining({ statusCode: 400 })
    );
    expect(() => buildListarErrosInputDto({ conteudo_id: '-2' }, 9)).toThrow(
      expect.objectContaining({ statusCode: 400 })
    );
  });
});
