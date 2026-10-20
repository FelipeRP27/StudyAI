const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const SCHEMA_PATH = path.join(__dirname, '..', '..', 'config', 'schema.sql');

function conexaoBase(database) {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database
  };
}

module.exports = async function prepararBanco() {
  require('dotenv').config({ quiet: true });

  const nomeBanco = process.env.TEST_DB_NAME || 'studyai_test';
  const administrador = new Client(conexaoBase('postgres'));

  try {
    await administrador.connect();
  } catch (error) {
    throw new Error(
      `Nao foi possivel conectar ao PostgreSQL em ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}. ` +
        'Suba o banco com "docker compose up -d db" antes de rodar os testes de integracao. ' +
        `Detalhe: ${error.message}`
    );
  }

  const existe = await administrador.query('SELECT 1 FROM pg_database WHERE datname = $1', [nomeBanco]);
  if (existe.rowCount === 0) {
    await administrador.query(`CREATE DATABASE ${nomeBanco}`);
  }
  await administrador.end();

  const banco = new Client(conexaoBase(nomeBanco));
  await banco.connect();
  await banco.query(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  await banco.end();
};
