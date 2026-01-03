import { PrismaClient } from '@prisma/client';
import logger from './logger.js';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

// Gestione connessione database
prisma.$connect()
  .then(() => {
    logger.info('Connessione al database PostgreSQL stabilita');
  })
  .catch((error) => {
    logger.error('Errore nella connessione al database:', error);
    process.exit(1);
  });

// Gestione errori di connessione
prisma.$on('error', (error) => {
  logger.error('Errore Prisma:', error);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`Ricevuto segnale ${signal}. Chiusura connessione database...`);

  try {
    await prisma.$disconnect();
    logger.info('Connessione database chiusa correttamente');
    process.exit(0);
  } catch (error) {
    logger.error('Errore durante la chiusura del database:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default prisma;
