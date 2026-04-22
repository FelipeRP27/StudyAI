const dotenv = require('dotenv');

dotenv.config();

const env = {
  port: Number(process.env.PORT) || 3000,
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: Number(process.env.DB_PORT) || 5432,
  dbName: process.env.DB_NAME || 'studyai',
  dbUser: process.env.DB_USER || 'postgres',
  dbPassword: process.env.DB_PASSWORD || 'postgres',
  jwtSecret: process.env.JWT_SECRET || 'change_this_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash'
};

module.exports = {
  env
};
