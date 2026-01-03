import crypto from 'crypto';
import { config } from '../config/index.js';
import logger from './logger.js';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

class EncryptionService {
  constructor() {
    this.key = Buffer.from(config.encryption.key.padEnd(32, '0').slice(0, 32));
    this.iv = Buffer.from(config.encryption.iv.padEnd(16, '0').slice(0, 16));
  }

  /**
   * Crittografa un testo in chiaro
   * @param {string} text - Testo da crittografare
   * @returns {string} - Testo crittografato in base64
   */
  encrypt(text) {
    if (!text) return null;

    try {
      const cipher = crypto.createCipheriv(ALGORITHM, this.key, this.iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      logger.error('Errore durante la crittografia:', error);
      throw new Error('Errore durante la crittografia dei dati');
    }
  }

  /**
   * Decrittografa un testo crittografato
   * @param {string} encryptedText - Testo crittografato
   * @returns {string} - Testo in chiaro
   */
  decrypt(encryptedText) {
    if (!encryptedText) return null;

    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, this.iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      logger.error('Errore durante la decrittografia:', error);
      throw new Error('Errore durante la decrittografia dei dati');
    }
  }

  /**
   * Crea un hash sicuro per le verifiche
   * @param {string} data - Dati da hashere
   * @returns {string} - Hash SHA-256
   */
  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Genera una stringa casuale sicura
   * @param {number} length - Lunghezza desiderata
   * @returns {string} - Stringa casuale
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

export default new EncryptionService();
