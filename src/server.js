const app = require('./app');
const { env } = require('./config/env');
const initDb = require('./config/initDb');

(async () => {
  try {
    await initDb();
    app.listen(env.port, () => {
      console.log(`StudyAI backend running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Falha ao inicializar o banco:', error.message);
    process.exit(1);
  }
})();
