// Direciona os repositorios para o banco de teste antes de qualquer require de config/database.
process.env.DB_NAME = process.env.TEST_DB_NAME || 'studyai_test';
