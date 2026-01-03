import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import logger from '../utils/logger.js';
import { config, validateConfig } from '../config/index.js';

/**
 * Registra un nuovo utente medico
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { username, password, email, title, fullName, phone, address } = req.body;

    // Validazione input
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        error: 'Username, password e email sono obbligatori'
      });
    }

    // Verifica se l'utente esiste già
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: existingUser.username === username
          ? 'Username già in uso'
          : 'Email già registrata'
      });
    }

    // Hash della password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crea l'utente
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: 'DOCTOR',
        profile: {
          create: {
            title: title || 'Dott.',
            fullName: fullName || username,
            phone: phone || '',
            address: address || '',
            email: email
          }
        }
      },
      include: {
        profile: true
      }
    });

    // Genera il token JWT
    const token = generateToken(user);

    logger.info(`Nuovo medico registrato: ${user.username}`);

    res.status(201).json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token
      },
      message: 'Registrazione completata con successo'
    });
  } catch (error) {
    logger.error('Errore registrazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la registrazione'
    });
  }
};

/**
 * Effettua il login
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username e password sono obbligatori'
      });
    }

    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { username },
      include: { profile: true }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account disattivato. Contatta l\'amministratore.'
      });
    }

    // Verifica la password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      // Log tentativo fallito per sicurezza
      logger.warn(`Tentativo login fallito per utente: ${username}`);

      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide'
      });
    }

    // Aggiorna il last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Genera il token JWT
    const token = generateToken(user);

    logger.info(`Login effettuato: ${user.username}`);

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token
      },
      message: 'Login effettuato con successo'
    });
  } catch (error) {
    logger.error('Errore login:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il login'
    });
  }
};

/**
 * Ottiene i dati dell'utente corrente
 * GET /api/auth/me
 */
export const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        profile: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    res.json({
      success: true,
      data: { user: sanitizeUser(user) }
    });
  } catch (error) {
    logger.error('Errore me:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dati utente'
    });
  }
};

/**
 * Aggiorna la password
 * PUT /api/auth/password
 */
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Password corrente e nuova password sono obbligatorie'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La nuova password deve essere di almeno 6 caratteri'
      });
    }

    // Trova l'utente con la password hash
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Verifica la password corrente
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Password corrente non corretta'
      });
    }

    // Aggiorna la password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    logger.info(`Password aggiornata per utente: ${user.username}`);

    res.json({
      success: true,
      message: 'Password aggiornata con successo'
    });
  } catch (error) {
    logger.error('Errore update password:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'aggiornamento della password'
    });
  }
};

/**
 * Effettua il logout
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  // In un sistema con JWT stateless, il logout viene gestito client-side
  // Per un sistema più sicuro, si potrebbe usare una blacklist di token

  res.json({
    success: true,
    message: 'Logout effettuato con successo'
  });
};

/**
 * Genera il token JWT
 */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/**
 * Rimuove i dati sensibili dall'oggetto utente
 */
function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    profile: user.profile
  };
}

export default {
  register,
  login,
  me,
  updatePassword,
  logout
};
