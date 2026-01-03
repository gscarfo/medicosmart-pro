import { Router } from 'express';
import { body, query } from 'express-validator';
import prescriptionController from '../controllers/prescriptionController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Tutte le rotte richiedono autenticazione
router.use(authenticate);

// Validazioni
const prescriptionValidation = [
  body('patientId')
    .isUUID()
    .withMessage('ID paziente non valido'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Contenuto prescrizione obbligatorio (max 5000 caratteri)'),
  body('diagnosis')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Diagnosi massimo 500 caratteri')
];

const sendValidation = [
  body('type')
    .isIn(['email', 'sms'])
    .withMessage('Tipo di invio non valido'),
  body('recipient')
    .optional()
    .isString()
];

// Route CRUD
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('patientId').optional().isUUID(),
  query('status').optional().isIn(['DRAFT', 'SIGNED', 'SENT', 'PRINTED', 'CANCELLED'])
], prescriptionController.getPrescriptions);

router.get('/:id', prescriptionController.getPrescription);

router.post('/', prescriptionValidation, prescriptionController.createPrescription);

router.post('/:id/sign', prescriptionController.signPrescription);

router.post('/:id/send', sendValidation, prescriptionController.sendPrescription);

router.get('/:id/download', prescriptionController.downloadPrescription);

router.delete('/:id', prescriptionController.deletePrescription);

export default router;
