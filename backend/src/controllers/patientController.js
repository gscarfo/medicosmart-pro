import prisma from '../utils/prisma.js';
import encryption from '../utils/encryption.js';
import logger from '../utils/logger.js';
import { Prisma } from '@prisma/client';

/**
 * Ottiene la lista dei pazienti con paginazione e filtri
 * GET /api/patients
 */
export const getPatients = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Costruisci i filtri
    const where = {
      doctorId: req.user.id,
      deletedAt: null
    };

    // Filtro di ricerca
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { fiscalCode: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Ordina
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Query al database
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          fiscalCode: true,
          gender: true,
          phone: true,
          email: true,
          createdAt: true
        }
      }),
      prisma.patient.count({ where })
    ]);

    // Decrittografa i dati sensibili
    const decryptedPatients = patients.map(patient => ({
      ...patient,
      fiscalCode: patient.fiscalCode ? encryption.decrypt(patient.fiscalCode) : null
    }));

    res.json({
      success: true,
      data: {
        patients: decryptedPatients,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    logger.error('Errore getPatients:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei pazienti'
    });
  }
};

/**
 * Ottiene un singolo paziente
 * GET /api/patients/:id
 */
export const getPatient = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findFirst({
      where: {
        id,
        doctorId: req.user.id,
        deletedAt: null
      },
      include: {
        prescriptions: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            content: true,
            diagnosis: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Paziente non trovato'
      });
    }

    // Decrittografa i dati sensibili
    const decryptedPatient = {
      ...patient,
      fiscalCode: patient.fiscalCode ? encryption.decrypt(patient.fiscalCode) : null,
      notes: patient.notes ? encryption.decrypt(patient.notes) : null,
      prescriptions: patient.prescriptions.map(rx => ({
        ...rx,
        content: rx.content ? encryption.decrypt(rx.content) : null
      }))
    };

    // Log audit
    await createAuditLog(req.user.id, 'READ', 'patients', patient.id, null, patient);

    res.json({
      success: true,
      data: { patient: decryptedPatient }
    });
  } catch (error) {
    logger.error('Errore getPatient:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero del paziente'
    });
  }
};

/**
 * Crea un nuovo paziente
 * POST /api/patients
 */
export const createPatient = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      birthDate,
      fiscalCode,
      gender,
      address,
      phone,
      email,
      notes,
      consentGiven
    } = req.body;

    // Validazione
    if (!firstName || !lastName || !birthDate) {
      return res.status(400).json({
        success: false,
        error: 'Nome, cognome e data di nascita sono obbligatori'
      });
    }

    if (!consentGiven) {
      return res.status(400).json({
        success: false,
        error: 'È necessario il consenso al trattamento dei dati'
      });
    }

    // Verifica codice fiscale duplicato per questo medico
    if (fiscalCode) {
      const existingPatient = await prisma.patient.findFirst({
        where: {
          doctorId: req.user.id,
          fiscalCode: encryption.encrypt(fiscalCode),
          deletedAt: null
        }
      });

      if (existingPatient) {
        return res.status(409).json({
          success: false,
          error: 'Esiste già un paziente con questo codice fiscale'
        });
      }
    }

    // Crea il paziente
    const patient = await prisma.patient.create({
      data: {
        doctorId: req.user.id,
        firstName,
        lastName,
        birthDate: new Date(birthDate),
        fiscalCode: fiscalCode ? encryption.encrypt(fiscalCode) : null,
        gender,
        address,
        phone,
        email,
        notes: notes ? encryption.encrypt(notes) : null,
        consentGiven: true,
        consentDate: new Date()
      }
    });

    // Log audit
    await createAuditLog(req.user.id, 'CREATE', 'patients', patient.id, null, patient);

    logger.info(`Nuovo paziente creato: ${patient.id} da medico ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: {
        patient: {
          ...patient,
          fiscalCode: fiscalCode,
          notes: notes
        }
      },
      message: 'Paziente creato con successo'
    });
  } catch (error) {
    logger.error('Errore createPatient:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella creazione del paziente'
    });
  }
};

/**
 * Aggiorna un paziente
 * PUT /api/patients/:id
 */
export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      birthDate,
      fiscalCode,
      gender,
      address,
      phone,
      email,
      notes
    } = req.body;

    // Verifica esistenza
    const existingPatient = await prisma.patient.findFirst({
      where: { id, doctorId: req.user.id, deletedAt: null }
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        error: 'Paziente non trovato'
      });
    }

    // Verifica codice fiscale duplicato
    if (fiscalCode && fiscalCode !== encryption.decrypt(existingPatient.fiscalCode || '')) {
      const duplicatePatient = await prisma.patient.findFirst({
        where: {
          doctorId: req.user.id,
          fiscalCode: encryption.encrypt(fiscalCode),
          deletedAt: null,
          NOT: { id }
        }
      });

      if (duplicatePatient) {
        return res.status(409).json({
          success: false,
          error: 'Esiste già un paziente con questo codice fiscale'
        });
      }
    }

    // Aggiorna il paziente
    const patient = await prisma.patient.update({
      where: { id },
      data: {
        firstName,
        lastName,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        fiscalCode: fiscalCode ? encryption.encrypt(fiscalCode) : undefined,
        gender,
        address,
        phone,
        email,
        notes: notes !== undefined ? encryption.encrypt(notes) : undefined
      }
    });

    // Log audit
    await createAuditLog(req.user.id, 'UPDATE', 'patients', id, existingPatient, patient);

    res.json({
      success: true,
      data: {
        patient: {
          ...patient,
          fiscalCode: fiscalCode,
          notes: notes
        }
      },
      message: 'Paziente aggiornato con successo'
    });
  } catch (error) {
    logger.error('Errore updatePatient:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento del paziente'
    });
  }
};

/**
 * Elimina un paziente (soft delete)
 * DELETE /api/patients/:id
 */
export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica esistenza
    const existingPatient = await prisma.patient.findFirst({
      where: { id, doctorId: req.user.id, deletedAt: null }
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        error: 'Paziente non trovato'
      });
    }

    // Soft delete
    await prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    // Log audit
    await createAuditLog(req.user.id, 'DELETE', 'patients', id, existingPatient, null);

    logger.info(`Paziente eliminato: ${id} da medico ${req.user.id}`);

    res.json({
      success: true,
      message: 'Paziente eliminato con successo'
    });
  } catch (error) {
    logger.error('Errore deletePatient:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione del paziente'
    });
  }
};

/**
 * Crea un log di audit
 */
async function createAuditLog(userId, action, entity, entityId, oldValue, newValue) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
        ipAddress: null,
        userAgent: null
      }
    });
  } catch (error) {
    logger.error('Errore creazione audit log:', error);
  }
}

export default {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient
};
