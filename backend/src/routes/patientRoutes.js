import { Router } from 'express';
import { body, query } from 'express-validator';
import patientController from '../controllers/patientController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Tutte le rotte richiedono autenticazione
router.use(authenticate);

// Validazioni
const patientValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nome obbligatorio (max 100 caratteri)'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Cognome obbligatorio (max 100 caratteri)'),
  body('birthDate')
    .isISO8601()
    .withMessage('Data di nascita non valida'),
  body('fiscalCode')
    .optional()
    .isLength({ min: 16, max: 16 })
    .withMessage('Codice fiscale non valido'),
  body('consentGiven')
    .isBoolean()
    .withMessage('Il consenso al trattamento dati è obbligatorio')
];

const updateValidation = [
  body('firstName').optional().trim().isLength({ min: 1, max: 100 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 100 }),
  body('birthDate').optional().isISO8601(),
  body('fiscalCode').optional().isLength({ min: 16, max: 16 })
];

// Route CRUD
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString()
], patientController.getPatients);

router.get('/:id', patientController.getPatient);

router.post('/', patientValidation, patientController.createPatient);

router.put('/:id', updateValidation, patientController.updatePatient);

router.delete('/:id', patientController.deletePatient);

export default router;
