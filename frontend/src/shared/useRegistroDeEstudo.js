import { useEffect } from 'react';
import { atividadeEstudoService } from '../services/atividadeEstudoService';

export function useRegistroDeEstudo(conteudoId, tipo, { ativo = true } = {}) {
  useEffect(() => {
    if (!ativo || !conteudoId || !tipo) return;
    atividadeEstudoService.registrar({ conteudo_id: Number(conteudoId), tipo }).catch(() => {});
  }, [conteudoId, tipo, ativo]);
}
