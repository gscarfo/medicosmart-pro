import prisma from '../utils/prisma.js';
import encryption from '../utils/encryption.js';
import pdfService from '../services/pdfService.js';
import communicationService from '../services/communicationService.js';
import logger from '../utils/logger.js';

/**
 * Ottiene la lista delle prescrizioni
 * GET /api/prescriptions
 */
export const getPrescriptions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      patientId,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      doctorId: req.user.id,
      deletedAt: null
    };

    if (patientId) {
      where.patientId = patientId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              birthDate: true,
              fiscalCode: true
            }
          }
        }
      }),
      prisma.prescription.count({ where })
    ]);

    // Decrittografa i contenuti
    const decryptedPrescriptions = prescriptions.map(prescription => ({
      ...prescription,
      content: prescription.content ? encryption.decrypt(prescription.content) : null,
      diagnosis: prescription.diagnosis ? encryption.decrypt(prescription.diagnosis) : null,
      patient: {
        ...prescription.patient,
        fiscalCode: prescription.patient.fiscalCode
          ? encryption.decrypt(prescription.patient.fiscalCode)
          : null
      }
    }));

    res.json({
      success: true,
      data: {
        prescriptions: decryptedPrescriptions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    logger.error('Errore getPrescriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle prescrizioni'
    });
  }
};

/**
 * Ottiene una singola prescrizione
 * GET /api/prescriptions/:id
 */
export const getPrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescription.findFirst({
      where: {
        id,
        doctorId: req.user.id,
        deletedAt: null
      },
      include: {
        patient: true,
        communications: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Prescrizione non trovata'
      });
    }

    const decryptedPrescription = {
      ...prescription,
      content: prescription.content ? encryption.decrypt(prescription.content) : null,
      diagnosis: prescription.diagnosis ? encryption.decrypt(prescription.diagnosis) : null,
      patient: {
        ...prescription.patient,
        fiscalCode: prescription.patient.fiscalCode
          ? encryption.decrypt(prescription.patient.fiscalCode)
          : null
      }
    };

    res.json({
      success: true,
      data: { prescription: decryptedPrescription }
    });
  } catch (error) {
    logger.error('Errore getPrescription:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero della prescrizione'
    });
  }
};

/**
 * Crea una nuova prescrizione
 * POST /api/prescriptions
 */
export const createPrescription = async (req, res) => {
  try {
    const { patientId, content, diagnosis, generatePdf = true } = req.body;

    // Validazione
    if (!patientId || !content) {
      return res.status(400).json({
        success: false,
        error: 'ID paziente e contenuto sono obbligatori'
      });
    }

    // Verifica che il paziente appartenga al medico
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, doctorId: req.user.id, deletedAt: null }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Paziente non trovato'
      });
    }

    // Crea la prescrizione
    const prescription = await prisma.prescription.create({
      data: {
        doctorId: req.user.id,
        patientId,
        content: encryption.encrypt(content),
        diagnosis: diagnosis ? encryption.encrypt(diagnosis) : null,
        status: 'DRAFT'
      },
      include: {
        patient: true
      }
    });

    logger.info(`Nuova prescrizione creata: ${prescription.id}`);

    res.status(201).json({
      success: true,
      data: {
        prescription: {
          ...prescription,
          content,
          diagnosis,
          patient: {
            ...prescription.patient,
            fiscalCode: prescription.patient.fiscalCode
              ? encryption.decrypt(prescription.patient.fiscalCode)
              : null
          }
        }
      },
      message: 'Prescrizione creata con successo'
    });
  } catch (error) {
    logger.error('Errore createPrescription:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella creazione della prescrizione'
    });
  }
};

/**
 * Firma e genera il PDF della prescrizione
 * POST /api/prescriptions/:id/sign
 */
export const signPrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescription.findFirst({
      where: { id, doctorId: req.user.id, deletedAt: null },
      include: {
        patient: true,
        doctor: {
          include: { profile: true }
        }
      }
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Prescrizione non trovata'
      });
    }

    if (prescription.status === 'SIGNED' || prescription.status === 'SENT') {
      return res.status(400).json({
        success: false,
        error: 'La prescrizione è già stata firmata'
      });
    }

    // Decrittografa il contenuto
    const decryptedContent = encryption.decrypt(prescription.content);
    const decryptedDiagnosis = prescription.diagnosis
      ? encryption.decrypt(prescription.diagnosis)
      : null;

    // Genera il PDF
    const pdfResult = await pdfService.generatePrescription({
      prescription: {
        ...prescription,
        content: decryptedContent,
        diagnosis: decryptedDiagnosis
      },
      doctor: prescription.doctor,
      patient: {
        ...prescription.patient,
        fiscalCode: prescription.patient.fiscalCode
          ? encryption.decrypt(prescription.patient.fiscalCode)
          : null
      }
    });

    // Aggiorna la prescrizione
    const updatedPrescription = await prisma.prescription.update({
      where: { id },
      data: {
        status: 'SIGNED',
        signedAt: new Date(),
        pdfUrl: pdfResult.url,
        pdfHash: pdfResult.hash
      },
      include: {
        patient: true
      }
    });

    logger.info(`Prescrizione firmata: ${id}`);

    res.json({
      success: true,
      data: {
        prescription: {
          ...updatedPrescription,
          content: decryptedContent,
          diagnosis: decryptedDiagnosis,
          patient: {
            ...updatedPrescription.patient,
            fiscalCode: updatedPrescription.patient.fiscalCode
              ? encryption.decrypt(updatedPrescription.patient.fiscalCode)
              : null
          }
        },
        pdfUrl: pdfResult.url
      },
      message: 'Prescrizione firmata e PDF generato'
    });
  } catch (error) {
    logger.error('Errore signPrescription:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella firma della prescrizione'
    });
  }
};

/**
 * Invia la prescrizione via email o SMS
 * POST /api/prescriptions/:id/send
 */
export const sendPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, recipient } = req.body; // type: 'email' | 'sms'

    if (!type || !['email', 'sms'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo di invio non valido (email o sms)'
      });
    }

    const prescription = await prisma.prescription.findFirst({
      where: { id, doctorId: req.user.id, deletedAt: null },
      include: {
        patient: true,
        doctor: {
          include: { profile: true }
        }
      }
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Prescrizione non trovata'
      });
    }

    if (prescription.status !== 'SIGNED' && prescription.status !== 'PRINTED') {
      return res.status(400).json({
        success: false,
        error: 'La prescrizione deve essere prima firmata'
      });
    }

    if (!prescription.pdfUrl) {
      return res.status(400).json({
        success: false,
        error: 'PDF non disponibile'
      });
    }

    // Determina il destinatario
    let targetRecipient = recipient;
    if (!targetRecipient) {
      if (type === 'email') {
        targetRecipient = prescription.patient.email;
      } else {
        targetRecipient = prescription.patient.phone;
      }
    }

    if (!targetRecipient) {
      return res.status(400).json({
        success: false,
        error: `Indirizzo ${type === 'email' ? 'email' : 'telefono'} del paziente non disponibile`
      });
    }

    // Invia la comunicazione
    const result = await communicationService.send({
      type,
      recipient: targetRecipient,
      prescription,
      doctor: prescription.doctor,
      patient: prescription.patient
    });

    // Aggiorna lo stato della prescrizione
    await prisma.prescription.update({
      where: { id },
      data: { status: 'SENT' }
    });

    logger.info(`Prescrizione ${id} inviata via ${type} a ${targetRecipient}`);

    res.json({
      success: true,
      data: {
        communication: result,
        message: `Prescrizione inviata con successo via ${type}`
      }
    });
  } catch (error) {
    logger.error('Errore sendPrescription:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'invio della prescrizione'
    });
  }
};

/**
 * Scarica il PDF della prescrizione
 * GET /api/prescriptions/:id/download
 */
export const downloadPrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescription.findFirst({
      where: { id, doctorId: req.user.id, deletedAt: null }
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: 'Prescrizione non trovata'
      });
    }

    if (!prescription.pdfUrl) {
      return res.status(404).json({
        success: false,
        error: 'PDF non disponibile'
      });
    }

    // Reindirizza al file PDF
    res.redirect(prescription.pdfUrl);
  } catch (error) {
    logger.error('Errore downloadPrescription:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel download del PDF'
    });
  }
};

/**
 * Elimina una prescrizione (soft delete)
 * DELETE /api/prescriptions/:id
 */
export const deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.prescription.findFirst({
      where: { id, doctorId: req.user.id, deletedAt: null }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Prescrizione non trovata'
      });
    }

    await prisma.prescription.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    logger.info(`Prescrizione eliminata: ${id}`);

    res.json({
      success: true,
      message: 'Prescrizione eliminata con successo'
    });
  } catch (error) {
    logger.error('Errore deletePrescription:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione della prescrizione'
    });
  }
};

export default {
  getPrescriptions,
  getPrescription,
  createPrescription,
  signPrescription,
  sendPrescription,
  downloadPrescription,
  deletePrescription
};
