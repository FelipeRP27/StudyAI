import { useEffect } from 'react';
import { atividadeEstudoService } from '../services/atividadeEstudoService';

const MINUTOS_ENTRE_REGISTROS = 30;
const registrosRecentes = new Map();

function registradoAgoraPouco(chave) {
  const ultimo = registrosRecentes.get(chave);
  return Boolean(ultimo) && Date.now() - ultimo < MINUTOS_ENTRE_REGISTROS * 60 * 1000;
}

export function useRegistroDeEstudo(conteudoId, tipo, { ativo = true } = {}) {
  useEffect(() => {
    if (!ativo || !conteudoId || !tipo) return;

    const chave = `${conteudoId}:${tipo}`;
    if (registradoAgoraPouco(chave)) return;

    registrosRecentes.set(chave, Date.now());
    atividadeEstudoService.registrar({ conteudo_id: Number(conteudoId), tipo }).catch(() => {
      registrosRecentes.delete(chave);
    });
  }, [conteudoId, tipo, ativo]);
}
