import { Router } from 'express';
import { body, query } from 'express-validator';
import adminController from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Richiede autenticazione e ruolo admin
router.use(authenticate);
router.use(authorize('ADMIN'));

// Statistiche
router.get('/stats', adminController.getStats);

// CRUD utenti
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['ADMIN', 'DOCTOR']),
  query('search').optional().isString()
], adminController.getUsers);

router.get('/:id', adminController.getUser);

router.post('/', [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username deve essere tra 3 e 50 caratteri'),
  body('email')
    .isEmail()
    .withMessage('Email non valida'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password minima 6 caratteri'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'DOCTOR'])
    .withMessage('Ruolo non valido')
], adminController.createUser);

router.put('/:id', [
  body('username').optional().isLength({ min: 3, max: 50 }),
  body('email').optional().isEmail(),
  body('role').optional().isIn(['ADMIN', 'DOCTOR']),
  body('isActive').optional().isBoolean()
], adminController.updateUser);

router.delete('/:id', adminController.deleteUser);

export default router;
