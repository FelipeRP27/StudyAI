# Mapeamento dos dados de desempenho

Levantamento dos dados que o StudyAI já registra e que alimentam o Plano de Estudo
Personalizado. Nenhuma tabela nova foi criada: a camada de orientação reaproveita
integralmente o que o estudo ativo já produz.

Autores: Liam Coifman Rodrigues, Felipe Ramalho Perdigão.

## Fonte primária

Toda a análise parte de `respostas_questoes`, gravada a cada questão respondida:

| Coluna | Uso na análise |
|---|---|
| `usuario_id` | Isola o histórico de cada estudante |
| `questao_id` | Liga a resposta ao conteúdo e à matéria |
| `is_correta` | Base da taxa de acerto |
| `created_at` | Recência — há quantos dias o conteúdo não é praticado |

O caminho até a matéria é sempre o mesmo:

```
respostas_questoes -> questoes -> conteudos -> materias
```

## Consultas disponíveis

Em `src/repositories/respostaRepository.js`:

| Função | Granularidade | Usada por |
|---|---|---|
| `getDesempenhoResumo` | Usuário | Desempenho e Plano de Estudo |
| `getDesempenhoPorMateria` | Matéria | Desempenho |
| `getEvolucaoDiaria` | Dia | Desempenho |
| `getResumoPorMateria` | Matéria | Drill-down de matéria |
| `getDesempenhoPorConteudoEmMateria` | Conteúdo dentro de uma matéria | Drill-down de matéria |
| `getDesempenhoPorConteudo` | Conteúdo, em todas as matérias | **Plano de Estudo** |

`getDesempenhoPorConteudo` foi a única adição: as demais já existiam e continuam
atendendo as telas de desempenho.

## O que a análise consome

`analiseDesempenhoService` recebe as linhas de `getDesempenhoPorConteudo` e deriva:

- **taxa de acerto** — `total_acertos / total_respostas`
- **volume** — `total_respostas`, que define se há dados suficientes para classificar
- **recência** — dias decorridos desde `ultima_resposta_em`
- **prioridade** — alta (< 60%), média (60% a 79%), baixa (>= 80%), `sem_dados`
  quando o conteúdo tem menos de 5 respostas

O plano só é gerado quando o usuário tem ao menos 10 respostas registradas e pelo
menos um conteúdo classificável. Abaixo disso o sistema devolve
`status: dados_insuficientes` e orienta questões de diagnóstico, em vez de
recomendar um conteúdo sem base.

## Lacunas para as próximas sprints

- Não há registro de **revisão** de resumo, pontos-chave ou conteúdo — só de
  questões e flashcards. A recência de estudo é aproximada pela última resposta.
- Os erros são contabilizados, mas não agrupados por assunto dentro do conteúdo,
  o que limita o diagnóstico fino ("dificuldade em anulação e revogação").
- Não existe marcação de erro revisado, necessária para o caderno de erros.
