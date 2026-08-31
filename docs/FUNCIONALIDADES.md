# StudyAI — Novas Funcionalidades (Sprints 6 a 10)

Documento de planejamento das próximas cinco sprints quinzenais.
Elaborado em 10/08/2026. Autores: Liam Coifman Rodrigues, Felipe Ramalho Perdigão.

---

## Sumário executivo

Hoje o StudyAI **gera** material de estudo: o aluno cola um texto, a IA devolve resumo, pontos-chave, questões e flashcards. Isso está entregue e funcionando.

O problema é que gerar material não é estudar. O aluno recebe o conteúdo e é abandonado ali: não há nada que diga o que revisar hoje, o que ele erra com frequência, o que o edital cobra e ele ainda não viu, ou quanto falta para estar pronto na data da prova.

O objetivo destas cinco sprints é a transição de **gerador de material** para **condutor de estudo**. Ao fim, o StudyAI sabe o que o aluno errou, quando ele precisa revisar cada assunto, o que o edital exige, quanto disso já foi coberto e o que ele deve fazer nas próximas duas horas.

### Calendário

| Sprint | Período | Tema | Funcionalidades |
|---|---|---|---|
| 6 | 11/08 – 24/08 | Núcleo do estudo ativo | F-01 a F-03 |
| 7 | 25/08 – 07/09 | Simulados e diagnóstico | F-04 a F-07 |
| 8 | 08/09 – 21/09 | Edital como espinha dorsal | F-08 a F-11 |
| 9 | 22/09 – 05/10 | IA profunda: tutor e discursiva | F-12 a F-15 |
| 10 | 06/10 – 19/10 | Retenção, mobile e entrega | F-16 a F-20 |

São 10 semanas corridas dentro de uma janela de 4 meses. A folga restante deve ser usada como buffer entre as sprints 8 e 9 — a Sprint 8 é a mais pesada do roadmap.

### Quem é o público-alvo

Candidato a concurso público brasileiro. Estuda por meses ou anos para uma única prova, geralmente conciliando com trabalho. Tem pouco tempo e muito conteúdo. Suas dores centrais, na ordem em que aparecem:

1. **Esquece o que estudou.** Estudou constitucional em março, a prova é em outubro, e em outubro não lembra mais.
2. **Repete os mesmos erros.** Erra a mesma pegadinha três vezes sem perceber que é a mesma.
3. **Não sabe onde está fraco.** A sensação de domínio não corresponde ao desempenho real.
4. **Não sabe por onde começar.** O edital tem 200 tópicos e ele não faz ideia da ordem.
5. **Não sabe se vai dar tempo.** Não tem visibilidade de quanto do edital já cobriu.
6. **Não consegue treinar discursiva.** Não tem quem corrija.
7. **Desiste no meio.** Estudo solitário e longo, sem retorno visível de progresso.

Cada funcionalidade abaixo é rastreada a uma dessas dores.

---

# Sprint 6 — Núcleo do estudo ativo

Corrige a lacuna conceitual mais grave do produto atual: o material é gerado uma vez e nunca mais volta.

---

## F-01 — Repetição espaçada nos flashcards

**Ataca a dor 1 (esquecimento).**

### O que é

Substitui o modelo atual de "revisado / não revisado" por um algoritmo de repetição espaçada. Ao ver a resposta de um flashcard, o aluno autoavalia em três níveis — **Errei**, **Difícil**, **Fácil** — e o sistema calcula quando aquele card deve reaparecer.

A progressão de intervalos é 1 → 3 → 7 → 15 → 30 → 60 dias. "Fácil" avança na escala, "Difícil" avança menos, "Errei" reseta o card para reaparecer no mesmo dia.

Três níveis, e não os seis do SM-2 original, é uma decisão deliberada: o custo cognitivo de escolher entre seis graus é alto o suficiente para o aluno abandonar a autoavaliação.

### Problema que resolve

Hoje o comportamento é o pior possível para retenção: o card é marcado como revisado uma vez e **desaparece permanentemente**. O aluno revisa constitucional em março, marca tudo como revisado, e o app nunca mais traz aquele conteúdo de volta. Em outubro, na prova, ele esqueceu.

A curva do esquecimento de Ebbinghaus é justamente o inimigo número um de quem estuda por meses para uma prova única. Repetição espaçada é a técnica com melhor evidência para combatê-la, e é a razão pela qual o Anki é praticamente obrigatório entre concurseiros. Sem isso, o flashcard do StudyAI é leitura passiva com passos extras.

### Mudanças técnicas

Migração aditiva, sem risco para bancos existentes:

```sql
ALTER TABLE flashcards_revisados ADD COLUMN IF NOT EXISTS intervalo_dias INTEGER NOT NULL DEFAULT 0;
ALTER TABLE flashcards_revisados ADD COLUMN IF NOT EXISTS facilidade NUMERIC(3,2) NOT NULL DEFAULT 2.50;
ALTER TABLE flashcards_revisados ADD COLUMN IF NOT EXISTS repeticoes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE flashcards_revisados ADD COLUMN IF NOT EXISTS proxima_revisao DATE NOT NULL DEFAULT CURRENT_DATE;

CREATE TABLE IF NOT EXISTS flashcards_revisoes_log (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  flashcard_id INTEGER NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  qualidade SMALLINT NOT NULL,
  intervalo_aplicado INTEGER NOT NULL,
  revisado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

O `UNIQUE (usuario_id, flashcard_id)` existente é **mantido** — aquela linha deixa de ser um marcador booleano e passa a ser o estado atual do card, atualizado via upsert. O histórico completo vai para a tabela de log.

- Novo `revisaoService` com a tabela-verdade do algoritmo.
- `PATCH /flashcards/:id/revisao { qualidade }` substitui o par marcar/desmarcar.
- `FlashcardsPage` troca o botão único pelos três de autoavaliação, com badge "volta em N dias".
- `flashcardOutputDto` deixa de expor `revisado_em` como fonte de verdade.

**Backfill necessário:** cards já marcados recebem `proxima_revisao = revisado_em::date + 7`.

---

## F-02 — Fila "Revisar hoje"

**Ataca as dores 1 e 4 (esquecimento, não saber por onde começar).**

### O que é

Uma fila única, atravessando todas as matérias e todos os conteúdos, com os cards cuja data de revisão chegou. Ordenada por atraso — o que venceu há mais tempo aparece primeiro. O dashboard passa a exibir o contador do dia ("23 cards para revisar hoje") como primeiro elemento da tela.

### Problema que resolve

Duas coisas ao mesmo tempo.

Primeiro, sem uma fila, o algoritmo da F-01 é inútil: de nada adianta o sistema saber que 23 cards venceram se o aluno precisa entrar conteúdo por conteúdo para descobrir isso.

Segundo, e mais importante, resolve a **paralisia de início**. O aluno abre o app com uma hora livre e trava decidindo o que fazer. Uma fila pronta remove a decisão: existe uma coisa certa a fazer hoje, e ela já está na tela. Essa é a mecânica que sustenta o hábito diário — em vez de "o que eu estudo?", a pergunta vira "quanto da fila eu consigo zerar?".

É também a primeira funcionalidade do app que atravessa conteúdos. Todo o resto hoje está preso dentro de um conteúdo específico, o que não corresponde a como ninguém estuda de verdade.

### Mudanças técnicas

- `GET /flashcards/revisao-hoje` — cards de todas as matérias com `proxima_revisao <= CURRENT_DATE`, ordenados por atraso decrescente.
- Nova rota de frontend `/revisar`, reaproveitando o componente de card 3D já existente.
- Contador no dashboard, com estado vazio comemorativo quando a fila zera.

---

## F-03 — Caderno de erros

**Ataca a dor 2 (repetir os mesmos erros).**

### O que é

Uma fila automática das questões que o aluno errou, para refazer. A questão entra na fila assim que é errada e só sai depois de **dois acertos consecutivos** — um acerto isolado pode ser chute, dois seguidos indicam aprendizado.

A fila é filtrável por matéria e ordenada por número de erros acumulados: o que mais derruba o aluno aparece primeiro. Ao responder, a justificativa da alternativa errada aparece imediatamente.

### Problema que resolve

O caderno de erros é o instrumento mais citado por aprovados e por professores de cursinho, e é sistematicamente o que o candidato mais deixa de fazer — porque manter um caderno manualmente dá trabalho e é chato.

Sem ele, o aluno erra a mesma pegadinha em março, em junho e na prova, sem nunca perceber que é a mesma pegadinha. O erro sinaliza exatamente onde está o buraco de conhecimento, e é justamente esse sinal que hoje se perde.

O ponto mais forte desta funcionalidade é o custo: **todos os dados necessários já estão no banco**. A tabela `respostas_questoes` grava toda tentativa desde a Sprint 4, com acerto ou erro e data. Nenhuma tabela nova é necessária, nenhuma alteração de schema. É puramente uma leitura nova sobre dados já coletados — o melhor retorno sobre esforço de todo o roadmap.

Hoje esse histórico é usado apenas para calcular percentuais no painel de desempenho, ou seja, para informar o aluno de que ele vai mal, sem oferecer nenhum caminho para corrigir.

### Mudanças técnicas

Nenhuma migração. A query usa window function sobre `respostas_questoes` para obter, por questão, a última resposta e o streak de acertos consecutivos.

- `GET /respostas/erros?materia_id=&limit=` — questões cuja última resposta foi errada ou cujo streak de acertos é menor que 2.
- Nova rota `/erros`, reaproveitando o componente de quiz de `QuestoesPage`.
- Contador de pendências no dashboard, ao lado do contador de revisão.

**Efeito colateral positivo:** como o simulado da F-04 também gravará em `respostas_questoes`, os erros cometidos em simulado alimentam automaticamente o caderno de erros.

---

# Sprint 7 — Simulados e diagnóstico

Reproduz a condição real de prova e transforma o painel de desempenho de descritivo em prescritivo.

---

## F-04 — Simulado multi-matéria

**Ataca a dor 3 (não saber onde está fraco) e a ansiedade de prova.**

### O que é

Sessão de prova simulada que sorteia N questões do acervo do aluno atravessando várias matérias, com cronômetro regressivo e **sem feedback até o fim**. A distribuição das questões é configurável: proporcional ao acervo, proporcional ao peso das matérias no edital, ou concentrada nas matérias mais fracas.

Durante a execução: navegação por grade de questões, possibilidade de marcar questão para revisar depois, tempo por questão registrado silenciosamente.

Ao finalizar, o aluno recebe o espelho: acertos por matéria, tempo médio por questão, e a lista das questões que consumiram mais tempo — mesmo as que ele acertou.

### Problema que resolve

Prova de concurso é multidisciplinar, cronometrada e sem feedback imediato. O estudo no StudyAI hoje é o oposto exato disso: uma matéria por vez, sem relógio, com o gabarito aparecendo logo após cada resposta.

Isso cria uma falsa sensação de domínio. Responder cinco questões de constitucional em sequência, sabendo que são todas de constitucional e com tempo livre, é uma tarefa muito mais fácil do que encontrar aquela mesma questão no meio de outras oitenta, sem saber de que matéria ela é, com o relógio correndo. O aluno que só treina do primeiro jeito descobre a diferença no dia da prova.

O registro de tempo por questão resolve uma dor específica e pouco atendida: **a gestão de tempo é o que mais reprova candidato bem preparado**. Muitos sabem o conteúdo e não terminam a prova. Saber que constitucional consome três minutos por questão enquanto português consome quarenta segundos muda a estratégia de ordem de resolução no dia — e essa informação não existe em lugar nenhum hoje.

### Mudanças técnicas

```sql
CREATE TABLE IF NOT EXISTS simulados (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(150) NOT NULL,
  total_questoes INTEGER NOT NULL,
  duracao_minutos INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'em_andamento'
    CHECK (status IN ('em_andamento','finalizado','abandonado')),
  iniciado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finalizado_em TIMESTAMP
);

CREATE TABLE IF NOT EXISTS simulado_questoes (
  id SERIAL PRIMARY KEY,
  simulado_id INTEGER NOT NULL REFERENCES simulados(id) ON DELETE CASCADE,
  questao_id INTEGER NOT NULL REFERENCES questoes(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  alternativa_id INTEGER REFERENCES alternativas(id) ON DELETE SET NULL,
  is_correta BOOLEAN,
  tempo_segundos INTEGER,
  respondido_em TIMESTAMP
);
```

- `POST /simulados` — sorteia as questões conforme a distribuição escolhida.
- `POST /simulados/:id/respostas` — grava resposta e tempo **sem devolver o gabarito**.
- `POST /simulados/:id/finalizar` — corrige, grava também em `respostas_questoes` e devolve o espelho.
- Rotas `/simulados` (lista e histórico) e `/simulados/:id` (modo prova).

---

## F-05 — Espelho de correção com gabarito comentado

**Ataca a dor 2 (repetir erros) — extensão da F-04.**

### O que é

A tela de resultado do simulado, apresentada apenas após a finalização: nota geral, desempenho por matéria comparado ao simulado anterior, distribuição do tempo, e a revisão questão a questão com a alternativa escolhida, a correta e a justificativa de cada uma.

### Problema que resolve

Fazer o simulado sem revisar depois é desperdício — e é o que a maioria faz, porque revisar dá trabalho e o resultado numérico já satisfaz a curiosidade. Ao entregar a revisão comentada pronta na mesma tela do resultado, o momento de maior atenção do aluno (acabou de ver a nota) é aproveitado para o aprendizado.

A comparação com o simulado anterior é o que dá sensação de progresso — que é o antídoto para a dor 7, a desistência.

Aqui o investimento da última sprint concluída se paga: a justificativa por alternativa já é gerada e armazenada. Ela existe no banco desde o commit `0c08962` e hoje só é vista por quem responde questão avulsa.

### Mudanças técnicas

Sem schema novo. Consome `simulado_questoes` mais `alternativas.justificativa`. Componente de revisão reaproveitável pelo caderno de erros.

---

## F-06 — Diagnóstico de fraquezas

**Ataca as dores 3 e 4 (não saber onde está fraco, não saber por onde começar).**

### O que é

Endpoint e widget de dashboard que respondem à pergunta "o que eu estudo agora?". Identifica as matérias e conteúdos com pior taxa de acerto, aplicando um volume mínimo de respostas para não acusar fraqueza com base em duas questões. Cada item vem com ação direta: gerar simulado focado, abrir o caderno de erros daquela matéria, ou revisar os flashcards do assunto.

### Problema que resolve

O painel de desempenho atual é **descritivo, não prescritivo**. Ele informa que o aluno acerta 62% em administrativo e para por aí. O aluno olha o número, sente-se mal e fecha a tela — nada mudou no comportamento de estudo dele.

Pior: existe uma tendência conhecida de estudar o que já se domina, porque é confortável e produz a sensação agradável de acertar tudo. O aluno naturalmente foge da matéria em que vai mal. Um sistema que aponta ativamente a fraqueza e oferece o caminho de correção em um clique combate esse viés.

A transição de "você vai mal em administrativo" para "faça este simulado de 15 questões de administrativo agora" é a diferença entre um relatório e um treinador.

### Mudanças técnicas

- `GET /desempenho/fraquezas` — top 5 matérias e conteúdos por taxa de acerto ascendente, com volume mínimo configurável.
- Widget "Onde focar" no dashboard, com CTAs para F-03 e F-04.

---

## F-07 — Dificuldade calibrada por questão

**Ataca a dor 3 e melhora a qualidade do material gerado.**

### O que é

Cada questão passa a ter uma dificuldade empírica, calculada pelo percentual de acerto real agregado entre todos os usuários que a responderam. O rótulo — fácil, média, difícil — é usado para balancear o sorteio dos simulados e para priorizar a fila de revisão.

### Problema que resolve

Hoje a dificuldade das questões geradas pela IA é imprevisível: o mesmo prompt produz uma questão trivial e uma capciosa, sem qualquer controle. Um simulado sorteado às cegas pode sair fácil demais (falsa confiança) ou difícil demais (desânimo). Nenhum dos dois treina bem.

Medir dificuldade pelo comportamento real dos usuários, em vez de pedir à IA que se autoavalie, produz um dado confiável a custo zero — basta agregar respostas que já estão sendo gravadas.

Como subproduto, expõe um problema de qualidade que hoje é invisível: uma questão que **ninguém** acerta provavelmente está errada ou ambígua, e pode ser sinalizada para regeneração.

### Mudanças técnicas

Sem tabela nova. View materializada ou consulta agregada sobre `respostas_questoes`, com refresh periódico. Índice adicional em `respostas_questoes (questao_id, is_correta)`.

---

# Sprint 8 — Edital como espinha dorsal

A sprint de maior impacto no produto. Também a mais pesada — se houver corte de escopo, ele deve acontecer aqui.

---

## F-08 — Importação de edital

**Ataca as dores 4 e 5 (não saber por onde começar, não saber se vai dar tempo). Resolve o cold start do produto.**

### O que é

O aluno anexa o PDF do edital. A IA extrai a estrutura completa — banca, cargo, matérias, tópicos e subtópicos — e o app monta sozinho a árvore de matérias e tópicos. O aluno revisa e edita a estrutura extraída antes de confirmar.

### Problema que resolve

Este é o maior atrito do produto hoje, e ele acontece nos **primeiros dois minutos de uso**. O usuário se cadastra, chega a um dashboard vazio e precisa inventar do zero: criar cada matéria manualmente, decidir nomes, decidir a ordem, e só então começar a colar conteúdo. É trabalho burocrático antes de qualquer valor entregue, e é exatamente onde a maioria dos usuários abandona um app de estudo.

Só que o concurseiro **já tem o edital**. É o primeiro documento que ele baixa, e é a fonte canônica do que precisa ser estudado. Colar esse PDF e ver a estrutura inteira do estudo aparecer pronta é o momento de maior impacto possível na primeira sessão de uso.

Mais do que conveniência, isso muda o eixo do produto. Hoje a organização do StudyAI é acidental: as matérias são o que o aluno lembrou de criar. Com o edital importado, a organização passa a ser **a fonte oficial da prova**, o que torna possível tudo que vem depois — medir cobertura (F-09), priorizar por peso (F-10) e responder se vai dar tempo.

### Mudanças técnicas

```sql
CREATE TABLE IF NOT EXISTS editais (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(150) NOT NULL,
  banca VARCHAR(80),
  cargo VARCHAR(120),
  data_prova DATE,
  texto_original TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS edital_topicos (
  id SERIAL PRIMARY KEY,
  edital_id INTEGER NOT NULL REFERENCES editais(id) ON DELETE CASCADE,
  materia_id INTEGER REFERENCES materias(id) ON DELETE CASCADE,
  titulo VARCHAR(250) NOT NULL,
  peso INTEGER NOT NULL DEFAULT 1,
  ordem INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE conteudos ADD COLUMN IF NOT EXISTS topico_id INTEGER
  REFERENCES edital_topicos(id) ON DELETE SET NULL;
```

- Novo prompt em `iaPrompts` retornando `{ banca, cargo, materias: [{ nome, topicos: [...] }] }`.
- `editalService` cria matérias e tópicos em transação única.
- Reaproveita a extração de PDF já existente em `extractTextFromFile.js`.

**Risco técnico principal:** edital é documento longo, muitas vezes acima da janela útil de contexto. Exige truncamento inteligente (isolar a seção de conteúdo programático antes de enviar) e teto de tamanho com erro claro. Esse é o card de maior incerteza do roadmap e deve ser atacado no primeiro dia da sprint.

---

## F-09 — Cobertura do edital

**Ataca a dor 5 (não saber se vai dar tempo).**

### O que é

Visualização do edital inteiro com semáforo por tópico: sem conteúdo cadastrado, com conteúdo mas sem estudo, estudado, ou dominado (com desempenho comprovado em questões). Percentual de cobertura ponderado pelo peso de cada tópico, por matéria e geral, mais a contagem regressiva para a data da prova.

### Problema que resolve

A ansiedade mais constante do concurseiro é não saber onde está. Ele estuda há quatro meses e não faz ideia se cobriu 30% ou 70% do que a prova exige. Essa incerteza tem dois efeitos ruins e opostos: pânico injustificado em quem está bem, e falsa tranquilidade em quem está mal.

Nenhuma ferramenta que ele usa hoje responde isso. Planilha de acompanhamento manual responde parcialmente, mas depende de disciplina para preencher e registra apenas "li o tópico", não "aprendi o tópico".

A diferença aqui é que a cobertura não é autodeclarada: um tópico só chega a "dominado" quando existe desempenho medido em questões daquele tópico. Isso combate diretamente a ilusão de domínio, que é o problema que o painel de desempenho atual não consegue tocar porque não sabe o que a prova cobra.

A contagem regressiva conectada ao percentual de cobertura produz a informação mais acionável de todo o app: *faltam 87 dias e 40% do edital*.

### Mudanças técnicas

- `GET /editais/:id/cobertura` — agregação por matéria e tópico cruzando `edital_topicos`, `conteudos.topico_id`, material gerado e `respostas_questoes`.
- Rota `/edital` com a árvore de tópicos, barras de cobertura e contagem regressiva.

---

## F-10 — Plano de estudo gerado por IA

**Ataca a dor 4 (não saber por onde começar) e a 5.**

### O que é

A partir do edital importado, dos pesos dos tópicos, da data da prova, das horas semanais disponíveis e do desempenho já registrado, a IA monta um cronograma de estudo distribuído até a data da prova. O plano não é um texto solto: ele é materializado como **tarefas reais** na entidade `tarefas`, que já existe desde a Sprint 4.

O plano é replanejável a qualquer momento, considerando o que já foi concluído e o que ficou atrasado.

### Problema que resolve

Montar cronograma é uma tarefa que o candidato sabe que precisa fazer, geralmente faz mal, e frequentemente abandona. Distribuir 200 tópicos com pesos diferentes em 6 meses de estudo, respeitando revisões e a própria disponibilidade, é um problema de planejamento genuinamente difícil — e é feito à mão, em planilha, por quem deveria estar estudando.

Pior: cronograma manual é rígido. Uma semana perdida por trabalho ou doença destrói o planejamento inteiro, e refazer dá tanto trabalho que a pessoa simplesmente para de seguir o plano. O replanejamento sob demanda ataca exatamente esse ponto de desistência.

A decisão de materializar o plano como `tarefas` em vez de exibi-lo como texto é o que separa esta funcionalidade de "a IA cuspiu um cronograma bonito". Cada item vira uma tarefa com prazo, marcável como concluída, entrando na visão de tarefas que o aluno já usa — o plano se integra à rotina em vez de virar mais um PDF esquecido.

### Mudanças técnicas

- `POST /editais/:id/plano { horas_semanais, data_prova }` — gera e materializa as tarefas.
- `ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS topico_id INTEGER REFERENCES edital_topicos(id) ON DELETE SET NULL;`
- Novo prompt de planejamento, recebendo tópicos com peso e desempenho atual.
- Botão de replanejar na tela do edital.

**Candidato a corte:** se a Sprint 8 estourar, este card migra para a Sprint 9. F-08 e F-09 entregam valor sem ele.

---

## F-11 — Onboarding guiado

**Ataca a dor 4 e a retenção de novos usuários.**

### O que é

Fluxo dedicado para usuário sem nenhuma matéria cadastrada: pergunta se ele tem o edital, oferece o upload, mostra o preview editável da estrutura extraída, confirma, e leva direto à criação do primeiro conteúdo. Com caminho alternativo manual para quem não tem o edital em mãos.

### Problema que resolve

O dashboard vazio é onde os usuários somem. Não porque o produto seja ruim, mas porque a primeira tela pede trabalho e não entrega nada. O usuário precisa entender o modelo mental do app — matéria contém conteúdo, conteúdo gera material — antes de ver qualquer benefício.

O onboarding inverte essa ordem: em menos de dois minutos, sem entender nada da estrutura interna, o aluno vê o edital dele virar uma árvore organizada na tela. O valor vem antes do esforço.

Também é o que garante que as funcionalidades da Sprint 8 sejam efetivamente usadas. A importação de edital escondida atrás de um botão em uma tela secundária seria ignorada pela maioria — colocada no caminho crítico da primeira sessão, ela se torna o padrão.

### Mudanças técnicas

Fluxo de frontend, sem backend novo. Detecção de estado vazio no dashboard, wizard de três passos, tela de preview com edição inline da estrutura antes da confirmação.

---

# Sprint 9 — IA profunda: tutor e discursiva

Aprofunda o uso da IA de geração de material para acompanhamento personalizado, e prepara a infraestrutura para uso multiusuário real.

---

## F-12 — Tutor no erro

**Ataca a dor 2 (repetir erros).**

### O que é

Botão "Não entendi, explica melhor" ao lado da justificativa de uma alternativa. A IA reexplica o ponto usando o conteúdo original como contexto, com linguagem mais simples e uma analogia concreta. O aluno pode complementar com uma dúvida específica em texto livre.

### Problema que resolve

A justificativa por alternativa, entregue na sprint anterior, é hoje um beco sem saída. Se o aluno lê "a alternativa C confunde competência privativa com competência exclusiva" e não sabe a diferença entre as duas, a explicação não ajuda — ela usa exatamente o conceito que ele não domina. Ele fica sem saída dentro do app e vai procurar no Google, quando volta.

Este é o momento de **maior intenção de aprendizado de toda a aplicação**: o aluno acabou de errar, sabe que errou, sabe por quê, e quer entender. Não atender essa intenção com o conteúdo original já disponível no banco é desperdiçar a melhor oportunidade pedagógica do produto.

É também um card de baixo custo. Todo o encanamento existe: `iaService` com cache e retry, o conteúdo original, o enunciado, a alternativa e a justificativa. Falta um prompt e uma rota.

### Mudanças técnicas

- `POST /questoes/:id/explicar { alternativa_id, duvida? }`.
- Prompt de reexplicação recebendo conteúdo original, enunciado, alternativa escolhida e justificativa.
- Aproveita o `ia_cache` existente quando não há dúvida em texto livre — explicações repetidas da mesma alternativa saem sem custo.

---

## F-13 — Questões discursivas com correção por IA

**Ataca a dor 6 (não conseguir treinar discursiva). Maior diferencial competitivo do roadmap.**

### O que é

Geração de questões discursivas a partir do conteúdo, junto com um espelho de correção. O aluno escreve a resposta em um editor com contador de linhas e palavras — bancas impõem limite rígido — e opcionalmente com cronômetro. A IA corrige devolvendo nota por critério (domínio do tema, estrutura e argumentação, linguagem e norma culta), trechos bem construídos, trechos a melhorar, e o que faltou frente ao espelho.

### Problema que resolve

Discursiva é a parte da preparação que o candidato **não consegue treinar sozinho**, por uma razão estrutural: escrever é fácil, avaliar a própria escrita é impossível. Ele não sabe se a resposta está boa, se cobriu o que a banca queria, se o português está adequado. Sem correção, treinar discursiva é escrever no vácuo.

A alternativa hoje é pagar por correção avulsa em cursinho — caro o suficiente para limitar a prática a poucas redações ao longo de meses de preparação, quando o que a habilidade exige é volume e repetição.

Bancas como CEBRASPE e FGV usam discursiva com peso alto e frequentemente eliminatório. É comum o candidato passar na objetiva e cair na discursiva justamente por nunca ter treinado com retorno.

É também a funcionalidade mais defensável do ponto de vista de uso de IA generativa: correção de texto aberto com feedback estruturado é uma tarefa em que o modelo é genuinamente bom, e que nenhuma solução determinística resolve. Do ponto de vista acadêmico, é o card que melhor demonstra domínio da tecnologia.

### Mudanças técnicas

```sql
CREATE TABLE IF NOT EXISTS discursivas (
  id SERIAL PRIMARY KEY,
  conteudo_id INTEGER NOT NULL REFERENCES conteudos(id) ON DELETE CASCADE,
  enunciado TEXT NOT NULL,
  criterios JSONB NOT NULL,
  linhas_maximas INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS discursivas_respostas (
  id SERIAL PRIMARY KEY,
  discursiva_id INTEGER NOT NULL REFERENCES discursivas(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  nota NUMERIC(4,2),
  feedback JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

- Dois prompts novos: geração de enunciado com espelho, e correção contra o espelho.
- Novo tipo `discursiva` no `CHECK` de `processamentos.tipo`.
- Editor com contagem de linhas e correção exibida lado a lado com o texto.

---

## F-14 — Governança de uso de IA

**Requisito de viabilidade, não funcionalidade de usuário.**

### O que é

Quota diária de chamadas de IA por usuário, registro de uso e expurgo do cache antigo.

### Problema que resolve

Hoje qualquer usuário autenticado pode disparar geração ilimitada. Com uma chave de API compartilhada, um único usuário em loop esgota a cota do projeto inteiro e **derruba a IA para todos** — inclusive durante uma apresentação. O `ia_cache` também cresce indefinidamente, sem qualquer política de expiração.

Não é funcionalidade visível, mas é o que separa um protótipo de algo que aguenta mais de um usuário simultâneo. Deve entrar antes da F-13, que é a mais cara em tokens de todo o roadmap.

### Mudanças técnicas

```sql
CREATE TABLE IF NOT EXISTS ia_uso (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL,
  modelo VARCHAR(60) NOT NULL,
  cache_hit BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

- Verificação de quota em `iaService.generateJson`, com `AppError` 429 e mensagem clara.
- Rotina de expurgo de `ia_cache` por idade.

---

## F-15 — Geração assíncrona de material

**Ataca uma dor de usabilidade real e destrava a escala.**

### O que é

`POST /processamentos` passa a responder imediatamente com 202 e um identificador; o frontend acompanha por polling e exibe cada tipo de material aparecendo conforme fica pronto.

### Problema que resolve

Hoje a geração completa executa quatro chamadas ao Gemini **em série dentro do request HTTP**. O aluno espera de trinta segundos a mais de um minuto olhando um spinner, sem saber se travou. Em conteúdo longo, o request pode estourar o timeout do navegador ou do proxy e perder todo o trabalho já feito — inclusive material que a IA já tinha gerado com sucesso.

A tabela `processamentos` já tem os campos de status e conclusão exatamente para isso desde a Sprint 3; ela só nunca foi usada de forma assíncrona. O custo é baixo e o ganho de percepção de velocidade é grande: ver o resumo aparecer em oito segundos, enquanto as questões ainda processam, é uma experiência completamente diferente de esperar um minuto por tudo.

### Mudanças técnicas

- `POST /processamentos` responde 202; execução em background.
- `GET /processamentos/:id` devolve status por tipo.
- Frontend com polling e exibição progressiva.

---

# Sprint 10 — Retenção, mobile e entrega

Fecha o ciclo: mantém o aluno voltando, entrega o produto onde ele realmente estuda, e prepara a apresentação final.

---

## F-16 — Meta diária e ofensiva

**Ataca a dor 7 (desistência).**

### O que é

Meta diária configurável de questões e cards, com anel de progresso no dashboard e contador de dias consecutivos cumpridos. Histórico dos últimos meses em formato de calendário.

### Problema que resolve

A preparação para concurso dura meses ou anos, com a única recompensa concreta lá no fim — e possivelmente nunca, já que a maioria não passa. É um dos contextos de estudo mais hostis à motivação que existem, e a desistência no meio do caminho é o desfecho mais comum.

Metas diárias e ofensiva resolvem isso convertendo um objetivo distante e incerto em uma vitória pequena e diária. O mecanismo é conhecido e funciona: uma sequência longa cria resistência a quebrá-la, e essa resistência sustenta a rotina nos dias de baixa motivação — que são exatamente os dias que decidem uma aprovação.

Combina diretamente com a fila da F-02: a fila diz o que fazer, a meta diz quanto, e a ofensiva diz por que não pular hoje.

### Mudanças técnicas

```sql
CREATE TABLE IF NOT EXISTS metas_diarias (
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  questoes_meta INTEGER NOT NULL DEFAULT 20,
  cards_meta INTEGER NOT NULL DEFAULT 30,
  questoes_feitas INTEGER NOT NULL DEFAULT 0,
  cards_revisados INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (usuario_id, data)
);
```

---

## F-17 — Exportação de material

**Ataca uma dor de confiança e de hábito estabelecido.**

### O que é

Exportação de resumos e pontos-chave em PDF formatado para impressão, e de flashcards em CSV compatível com a importação do Anki.

### Problema que resolve

Duas coisas.

Boa parte do público mantém material impresso — grifa, anota na margem, revisa no papel. Não é preferência a ser corrigida, é um hábito consolidado, e um app que não permite levar o material para fora perde para o caderno.

A exportação para Anki é uma concessão estratégica. Quem já usa Anki tem centenas de cards e anos de histórico de repetição; essa pessoa não vai migrar. Oferecer exportação transforma o StudyAI de concorrente perdedor em **gerador de conteúdo para a ferramenta que ela já usa** — o valor da geração por IA é entregue mesmo para quem não vai adotar o app inteiro.

Há ainda o efeito sobre a confiança: saber que o material pode sair do sistema a qualquer momento reduz a hesitação em investir tempo colocando conteúdo nele.

### Mudanças técnicas

- `GET /conteudos/:id/exportar?formato=pdf` — resumo e pontos-chave.
- `GET /conteudos/:id/flashcards/exportar?formato=csv` — formato de importação do Anki.

---

## F-18 — Mobile e PWA

**Ataca uma restrição de contexto de uso.**

### O que é

Auditoria e correção responsiva das telas de quiz, flashcards, revisão e simulado; alvos de toque adequados; gesto de deslizar nos flashcards; manifest e service worker para instalação na tela inicial do celular.

### Problema que resolve

O concurseiro estuda em janelas curtas e fragmentadas: fila de banco, ônibus, intervalo do trabalho, sala de espera. Nesses momentos ele tem o celular, não o notebook.

E são exatamente esses momentos que combinam melhor com as funcionalidades desta sprint. Ninguém abre o notebook para revisar oito flashcards, mas todo mundo revisa oito flashcards em cinco minutos de fila. Sem uso confortável no celular, a fila de revisão diária — que depende de constância, não de sessões longas — simplesmente não é cumprida.

Instalar como aplicativo na tela inicial remove o atrito de digitar uma URL e faz o ícone competir por atenção junto com os outros apps, o que sustenta o hábito da F-16.

### Mudanças técnicas

Trabalho concentrado em `global.css` e nos componentes de estudo. Manifest, service worker e ícones. Sem mudança de backend.

---

## F-19 — Busca global

**Ataca uma dor que só aparece com uso prolongado.**

### O que é

Busca única sobre matérias, conteúdos, questões e flashcards, tolerante a erro de digitação e sem exigir acentuação correta.

### Problema que resolve

Nas primeiras semanas o aluno tem cinco conteúdos e navega por memória. Depois de seis meses de preparação, ele tem centenas — e não consegue encontrar aquele resumo sobre improbidade administrativa que sabe ter criado em algum lugar. A navegação hierárquica por matéria e conteúdo, que é a única forma de acesso hoje, deixa de funcionar em escala.

É uma dor que não aparece em demonstração nem em teste curto, e por isso costuma ser descoberta tarde demais — justamente quando o usuário já tem material acumulado suficiente para ser difícil de abandonar o app, e é aí que a frustração dói mais.

A tolerância a erro de digitação importa porque a terminologia jurídica é longa e difícil de escrever: quem procura "inconstitucionalidade" precisa encontrar mesmo digitando errado.

### Mudanças técnicas

- `GET /busca?q=` com resultados agrupados por tipo.
- Extensão `pg_trgm` e índices GIN nas colunas de texto pesquisáveis.

---

## F-20 — Qualidade, CI e fechamento

**Requisito de entrega acadêmica.**

### O que é

Testes de integração contra banco real (mantendo apenas o Gemini mockado, conforme a convenção do projeto), pipeline no GitHub Actions rodando a suíte a cada PR, revisão de acessibilidade, atualização de README e documentação de API, e seed de demonstração cobrindo todas as funcionalidades novas.

### Problema que resolve

A suíte atual tem 58 testes unitários com o banco não coberto. Depois de cinco sprints e onze tabelas novas, a maior parte da complexidade nova passa a estar exatamente nas consultas — window function do caderno de erros, agregação de cobertura do edital, sorteio de simulado. São justamente os pontos que teste unitário com mock não alcança.

O seed de demonstração tem valor próprio para a apresentação: mostrar repetição espaçada, cobertura de edital e evolução de desempenho exige histórico de meses, que não dá para produzir ao vivo na banca.

---

# Consolidação

## Impacto no schema

| Sprint | Tabelas novas | Alterações em tabelas existentes |
|---|---|---|
| 6 | `flashcards_revisoes_log` | 4 colunas em `flashcards_revisados` |
| 7 | `simulados`, `simulado_questoes` | índice em `respostas_questoes` |
| 8 | `editais`, `edital_topicos` | `conteudos.topico_id`, `tarefas.topico_id` |
| 9 | `discursivas`, `discursivas_respostas`, `ia_uso` | novo tipo em `processamentos.tipo` |
| 10 | `metas_diarias` | índices `pg_trgm` |

Todas as mudanças são aditivas, no padrão `CREATE TABLE IF NOT EXISTS` e `ALTER TABLE ADD COLUMN IF NOT EXISTS` já adotado em `src/config/schema.sql`. Nenhum banco existente quebra, e a arquitetura em camadas não é refatorada — cada funcionalidade entra como Controller → Service → Repository com DTOs de entrada e saída, seguindo o padrão vigente.

## Rastreamento dor → funcionalidade

| Dor do público-alvo | Funcionalidades |
|---|---|
| 1. Esquece o que estudou | F-01, F-02 |
| 2. Repete os mesmos erros | F-03, F-05, F-12 |
| 3. Não sabe onde está fraco | F-04, F-06, F-07 |
| 4. Não sabe por onde começar | F-02, F-06, F-08, F-10, F-11 |
| 5. Não sabe se vai dar tempo | F-08, F-09, F-10 |
| 6. Não consegue treinar discursiva | F-13 |
| 7. Desiste no meio | F-05, F-16, F-18 |

## Prioridade em caso de corte

Se o prazo apertar, a ordem de preservação é:

1. **F-01, F-02, F-03** — sem elas o produto continua sendo um gerador de material, e o roadmap inteiro perde a premissa.
2. **F-08, F-09** — maior diferencial e o que resolve o cold start.
3. **F-04, F-05** — o que o usuário mais pede depois das anteriores.
4. **F-13** — maior valor demonstrável para a avaliação acadêmica.
5. O restante é polimento e sustentação.

Os cards de menor risco e maior retorno imediato são **F-03** (nenhuma migração, dados já coletados) e **F-12** (uma rota e um prompt sobre infraestrutura pronta).
O card de maior incerteza é **F-08**, pelo tamanho do texto do edital frente à janela de contexto do modelo.
