import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica variabili d'ambiente
dotenv.config({ path: join(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  database: {
    url: process.env.DATABASE_URL
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY,
    iv: process.env.ENCRYPTION_IV
  },

  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.FROM_EMAIL || 'noreply@medicosmart.app',
    fromName: process.env.FROM_NAME || 'MedicoSmart'
  },

  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  },

  pdf: {
    storagePath: process.env.PDF_STORAGE_PATH || './uploads/pdfs',
    baseUrl: process.env.PDF_BASE_URL || 'http://localhost:3000'
  },

  logger: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs'
  }
};

// Validazione configurazione critica
export function validateConfig() {
  const errors = [];

  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    errors.push('JWT_SECRET deve essere di almeno 32 caratteri');
  }

  if (!config.database.url) {
    errors.push('DATABASE_URL è obbligatoria');
  }

  if (!config.encryption.key || config.encryption.key.length < 32) {
    errors.push('ENCRYPTION_KEY deve essere di almeno 32 caratteri');
  }

  if (errors.length > 0) {
    throw new Error(`Configurazione non valida:\n${errors.join('\n')}`);
  }

  return config;
}

export default { config, validateConfig };
