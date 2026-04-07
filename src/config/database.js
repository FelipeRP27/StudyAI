const { Pool } = require('pg');
const { env } = require('./env');

const pool = new Pool({
  host: env.dbHost,
  port: env.dbPort,
  database: env.dbName,
  user: env.dbUser,
  password: env.dbPassword
});

const query = (text, params) => pool.query(text, params);

module.exports = {
  pool,
  query
};
