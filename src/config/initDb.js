const fs = require('fs');
const path = require('path');
const db = require('./database');

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

async function initDb() {
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  await db.query(sql);
  console.log('Schema aplicado com sucesso (CREATE TABLE IF NOT EXISTS).');
}

module.exports = initDb;
