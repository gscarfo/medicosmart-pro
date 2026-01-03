import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, validateConfig } from './config/index.js';
import logger from './utils/logger.js';
import prisma from './utils/prisma.js';

// Importa le rotte
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// Validazione configurazione
try {
  validateConfig();
} catch (error) {
  logger.error(error.message);
  process.exit(1);
}

// ========== MIDDLEWARE ==========

// Sicurezza HTTP
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // massimo 100 richieste per finestra
  message: {
    success: false,
    error: 'Troppe richieste, riprova più tardi'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Rate limiting per login (più stringente)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Troppi tentativi di login, riprova tra 15 minuti'
  }
});
app.use('/api/auth/login', loginLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging richieste
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// ========== STATIC FILES ==========

// Serve i PDF generati
app.use('/uploads/pdfs', express.static(
  new URL('../uploads/pdfs', import.meta.url).pathname
));

// ========== API ROUTES ==========

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MedicoSmart API funzionante',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rotte API
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/admin', adminRoutes);

// ========== ERROR HANDLING ==========

// 404 - Risorsa non trovata
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Risorsa non trovata'
  });
});

// Error handler globale
app.use((err, req, res, next) => {
  logger.error('Errore non gestito:', err);

  // Gestione errori Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'Risorsa già esistente'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Risorsa non trovata'
    });
  }

  // Errore generico
  res.status(err.status || 500).json({
    success: false,
    error: config.env === 'production'
      ? 'Errore interno del server'
      : err.message
  });
});

// ========== SERVER ==========

const PORT = config.port;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`========================================`);
  logger.info(`🚀 MedicoSmart API Server avviato`);
  logger.info(`📍 http://${HOST}:${PORT}`);
  logger.info(`🌍 Ambiente: ${config.env}`);
  logger.info(`========================================`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`\n📴 Ricevuto ${signal}. Arresto server...`);

  server.close(async () => {
    logger.info('Server HTTP chiuso');

    try {
      await prisma.$disconnect();
      logger.info('Connessione database chiusa');
      process.exit(0);
    } catch (error) {
      logger.error('Errore durante la chiusura:', error);
      process.exit(1);
    }
  });

  // Force close dopo 10 secondi
  setTimeout(() => {
    logger.error('Chiusura forzata dopo timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
