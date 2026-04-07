const app = require('./app');
const { env } = require('./config/env');

app.listen(env.port, () => {
  console.log(`StudyAI backend running on port ${env.port}`);
});
