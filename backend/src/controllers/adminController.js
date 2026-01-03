import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import logger from '../utils/logger.js';

/**
 * Controller per la gestione admin degli utenti
 */
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { fullName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          profile: {
            select: {
              title: true,
              fullName: true,
              phone: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    logger.error('Errore getUsers:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero degli utenti'
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
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
      data: { user }
    });
  } catch (error) {
    logger.error('Errore getUser:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dell\'utente'
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, password, email, role, title, fullName, phone, address } = req.body;

    // Validazione
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        error: 'Username, password e email sono obbligatori'
      });
    }

    // Verifica duplicato
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

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crea utente
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: role || 'DOCTOR',
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
      include: { profile: true }
    });

    logger.info(`Nuovo utente creato dall'admin ${req.user.id}: ${user.username}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      },
      message: 'Utente creato con successo'
    });
  } catch (error) {
    logger.error('Errore createUser:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella creazione dell\'utente'
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, isActive, title, fullName, phone, address } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Verifica duplicato username/email
    if (username !== existingUser.username || email !== existingUser.email) {
      const duplicate = await prisma.user.findFirst({
        where: {
          OR: [
            { username, NOT: { id } },
            { email, NOT: { id } }
          ]
        }
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          error: 'Username o email già in uso'
        });
      }
    }

    // Aggiorna utente
    const user = await prisma.user.update({
      where: { id },
      data: {
        username,
        email,
        role,
        isActive
      },
      include: { profile: true }
    });

    // Aggiorna profilo
    if (title || fullName || phone || address) {
      await prisma.doctorProfile.update({
        where: { userId: id },
        data: {
          title,
          fullName,
          phone,
          address
        }
      });
    }

    logger.info(`Utente aggiornato dall'admin ${req.user.id}: ${user.username}`);

    res.json({
      success: true,
      data: { user },
      message: 'Utente aggiornato con successo'
    });
  } catch (error) {
    logger.error('Errore updateUser:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento dell\'utente'
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Non permettere eliminazione di se stessi
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Non puoi eliminare il tuo account'
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      });
    }

    // Soft delete - disattiva l'utente
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    logger.info(`Utente disattivato dall'admin ${req.user.id}: ${existingUser.username}`);

    res.json({
      success: true,
      message: 'Utente disattivato con successo'
    });
  } catch (error) {
    logger.error('Errore deleteUser:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione dell\'utente'
    });
  }
};

export const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalDoctors,
      totalAdmins,
      activeUsers,
      recentUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'DOCTOR' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalDoctors,
          totalAdmins,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers
        },
        recentUsers
      }
    });
  } catch (error) {
    logger.error('Errore getStats:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle statistiche'
    });
  }
};

export default {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getStats
};
