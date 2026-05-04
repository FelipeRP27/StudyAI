const {
  calcularDiasRestantes,
  calcularUrgencia,
  toTarefaResponseDto
} = require('../dtos/tarefaOutputDto');

const HOJE = new Date('2026-05-04T12:00:00Z');

function dataMaisDias(dias) {
  const d = new Date(HOJE);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

describe('calcularDiasRestantes', () => {
  test('retorna 0 quando o limite e hoje', () => {
    expect(calcularDiasRestantes(dataMaisDias(0), HOJE)).toBe(0);
  });

  test('retorna positivo para datas futuras', () => {
    expect(calcularDiasRestantes(dataMaisDias(5), HOJE)).toBe(5);
  });

  test('retorna negativo para datas no passado', () => {
    expect(calcularDiasRestantes(dataMaisDias(-3), HOJE)).toBe(-3);
  });

  test('retorna null quando data ausente', () => {
    expect(calcularDiasRestantes(null, HOJE)).toBeNull();
  });
});

describe('calcularUrgencia', () => {
  test('concluida tem prioridade sobre dias restantes', () => {
    expect(calcularUrgencia({ status: 'concluida', diasRestantes: -5 })).toBe('concluida');
  });

  test('vencida quando dias < 0', () => {
    expect(calcularUrgencia({ status: 'pendente', diasRestantes: -1 })).toBe('vencida');
  });

  test('urgente quando ate 3 dias', () => {
    expect(calcularUrgencia({ status: 'pendente', diasRestantes: 0 })).toBe('urgente');
    expect(calcularUrgencia({ status: 'pendente', diasRestantes: 3 })).toBe('urgente');
  });

  test('proxima entre 4 e 7 dias', () => {
    expect(calcularUrgencia({ status: 'pendente', diasRestantes: 4 })).toBe('proxima');
    expect(calcularUrgencia({ status: 'pendente', diasRestantes: 7 })).toBe('proxima');
  });

  test('normal acima de 7 dias', () => {
    expect(calcularUrgencia({ status: 'pendente', diasRestantes: 8 })).toBe('normal');
  });
});

describe('toTarefaResponseDto', () => {
  test('inclui materia_nome e calcula campos derivados', () => {
    const dto = toTarefaResponseDto(
      {
        id: 1,
        usuario_id: 1,
        materia_id: 2,
        titulo: 'Revisar',
        descricao: 'capitulo 3',
        data_limite: dataMaisDias(2),
        status: 'pendente',
        created_at: '2026-05-04T10:00:00Z',
        concluida_em: null,
        materia_nome: 'Direito Administrativo'
      },
      HOJE
    );

    expect(dto.materia_nome).toBe('Direito Administrativo');
    expect(dto.dias_restantes).toBe(2);
    expect(dto.urgencia).toBe('urgente');
  });

  test('materia_nome cai para null quando ausente', () => {
    const dto = toTarefaResponseDto(
      {
        id: 1,
        materia_id: null,
        titulo: 'X',
        descricao: null,
        data_limite: dataMaisDias(20),
        status: 'pendente',
        created_at: '2026-05-04T10:00:00Z',
        concluida_em: null
      },
      HOJE
    );

    expect(dto.materia_nome).toBeNull();
    expect(dto.urgencia).toBe('normal');
  });
});
