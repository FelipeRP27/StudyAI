const { pool } = require('../config/database');
const assuntoQuestaoService = require('../services/assuntoQuestaoService');

async function main() {
  console.log('Classificando assunto das questoes existentes...');

  const relatorio = await assuntoQuestaoService.classificarQuestoesSemAssunto({
    onProgresso: ({ conteudo, classificadas, sem_assunto: semAssunto, erro }) => {
      if (erro) {
        console.log(`  [falha] conteudo ${conteudo.id} (${conteudo.titulo}): ${erro}`);
        return;
      }
      console.log(
        `  conteudo ${conteudo.id} (${conteudo.titulo}): ${classificadas} classificadas, ${semAssunto} sem assunto`
      );
    }
  });

  console.log(
    `Concluido: ${relatorio.conteudos} conteudos, ${relatorio.classificadas} questoes classificadas, ` +
      `${relatorio.sem_assunto} sem assunto, ${relatorio.falhas.length} falhas.`
  );

  return relatorio.falhas.length > 0 ? 1 : 0;
}

main()
  .then((codigo) => {
    process.exitCode = codigo;
  })
  .catch((error) => {
    console.error('Falha ao classificar assuntos:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
