import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Validazioni
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username deve essere tra 3 e 50 caratteri')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username può contenere solo lettere, numeri e underscore'),
  body('email')
    .isEmail()
    .withMessage('Email non valida')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password deve essere di almeno 6 caratteri')
];

const loginValidation = [
  body('username').notEmpty().withMessage('Username obbligatorio'),
  body('password').notEmpty().withMessage('Password obbligatoria')
];

// Route
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/me', authenticate, authController.me);
router.put('/password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Password corrente obbligatoria'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nuova password minima 6 caratteri')
], authController.updatePassword);
router.post('/logout', authenticate, authController.logout);

export default router;
