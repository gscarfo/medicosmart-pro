import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import prisma from '../utils/prisma.js';
import logger from '../utils/logger.js';

/**
 * Middleware di autenticazione JWT
 * Verifica il token e aggiunge l'utente alla richiesta
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token di autenticazione mancante'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwt.secret);

    // Recupera l'utente dal database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        profile: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account disattivato'
      });
    }

    // Aggiorna il last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Aggiungi l'utente alla richiesta
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token scaduto',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token non valido'
      });
    }

    logger.error('Errore autenticazione:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore durante l\'autenticazione'
    });
  }
};

/**
 * Middleware per verificare il ruolo dell'utente
 * @param {string[]} roles - Ruoli ammessi
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Non hai i permessi per accedere a questa risorsa'
      });
    }

    next();
  };
};

/**
 * Middleware per verificare che l'utente sia un amministratore
 */
export const isAdmin = authorize('ADMIN');

/**
 * Middleware per verificare che l'utente sia un medico
 */
export const isDoctor = authorize('DOCTOR', 'ADMIN');

/**
 * Middleware per verificare che l'utente possa accedere solo ai propri dati
 */
export const isOwnerOrAdmin = (Model, paramName = 'id', userField = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await Model.findUnique({
        where: { id: resourceId }
      });

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Risorsa non trovata'
        });
      }

      // Se l'utente è admin, può accedere a tutto
      if (req.user.role === 'ADMIN') {
        req.resource = resource;
        return next();
      }

      // Verifica che la risorsa appartenga all'utente
      if (resource[userField] !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Non hai i permessi per accedere a questa risorsa'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      logger.error('Errore verifica ownership:', error);
      return res.status(500).json({
        success: false,
        error: 'Errore durante la verifica dei permessi'
      });
    }
  };
};

export default {
  authenticate,
  authorize,
  isAdmin,
  isDoctor,
  isOwnerOrAdmin
};
