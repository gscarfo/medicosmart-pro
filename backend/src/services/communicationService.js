import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import prisma from '../utils/prisma.js';

/**
 * Servizio per l'invio di comunicazioni (Email e SMS)
 */
class CommunicationService {
  constructor() {
    this.initEmailClient();
    this.initSmsClient();
  }

  /**
   * Inizializza il client email
   */
  initEmailClient() {
    if (config.email.host && config.email.user && config.email.pass) {
      this.emailTransporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465,
        auth: {
          user: config.email.user,
          pass: config.email.pass
        }
      });

      logger.info('Client email inizializzato');
    } else {
      logger.warn('Client email non configurato - funzionalità disabilitata');
      this.emailTransporter = null;
    }
  }

  /**
   * Inizializza il client SMS (Twilio)
   */
  initSmsClient() {
    if (config.sms.accountSid && config.sms.authToken) {
      this.smsClient = twilio(
        config.sms.accountSid,
        config.sms.authToken
      );

      logger.info('Client SMS (Twilio) inizializzato');
    } else {
      logger.warn('Client SMS non configurato - funzionalità disabilitata');
      this.smsClient = null;
    }
  }

  /**
   * Invia una comunicazione
   */
  async send({ type, recipient, prescription, doctor, patient }) {
    switch (type) {
      case 'email':
        return this.sendEmail({ recipient, prescription, doctor, patient });
      case 'sms':
        return this.sendSms({ recipient, prescription, doctor, patient });
      default:
        throw new Error('Tipo di comunicazione non valido');
    }
  }

  /**
   * Invia email con allegato PDF
   */
  async sendEmail({ recipient, prescription, doctor, patient }) {
    // Crea record comunicazione
    const communication = await prisma.communication.create({
      data: {
        prescriptionId: prescription.id,
        type: 'EMAIL',
        recipient,
        status: 'PENDING'
      }
    });

    try {
      if (!this.emailTransporter) {
        // Modalità demo - simula invio
        logger.info(`[DEMO] Email inviata a ${recipient}`);

        await prisma.communication.update({
          where: { id: communication.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            deliveredAt: new Date()
          }
        });

        return {
          id: communication.id,
          type: 'email',
          recipient,
          status: 'sent',
          message: 'Email inviata (modalità demo)'
        };
      }

      const today = new Date().toLocaleDateString('it-IT');

      const mailOptions = {
        from: `"${config.email.fromName}" <${config.email.from}>`,
        to: recipient,
        subject: `Ricetta Medica - ${patient.firstName} ${patient.lastName} - ${today}`,
        html: this.getEmailTemplate({ prescription, doctor, patient, today }),
        attachments: prescription.pdfUrl ? [
          {
            filename: `ricetta_${patient.lastName}_${today.replace(/\//g, '-')}.pdf`,
            path: prescription.pdfUrl
          }
        ] : []
      };

      const result = await this.emailTransporter.sendMail(mailOptions);

      // Aggiorna record comunicazione
      await prisma.communication.update({
        where: { id: communication.id },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      });

      logger.info(`Email inviata a ${recipient}: ${result.messageId}`);

      return {
        id: communication.id,
        type: 'email',
        recipient,
        messageId: result.messageId,
        status: 'sent'
      };
    } catch (error) {
      // Aggiorna record con errore
      await prisma.communication.update({
        where: { id: communication.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      });

      logger.error('Errore invio email:', error);
      throw error;
    }
  }

  /**
   * Invia SMS con link al download
   */
  async sendSms({ recipient, prescription, doctor, patient }) {
    // Crea record comunicazione
    const communication = await prisma.communication.create({
      data: {
        prescriptionId: prescription.id,
        type: 'SMS',
        recipient,
        status: 'PENDING'
      }
    });

    try {
      if (!this.smsClient || !config.sms.phoneNumber) {
        // Modalità demo - simula invio
        logger.info(`[DEMO] SMS inviato a ${recipient}`);

        await prisma.communication.update({
          where: { id: communication.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            deliveredAt: new Date()
          }
        });

        return {
          id: communication.id,
          type: 'sms',
          recipient,
          status: 'sent',
          message: 'SMS inviato (modalità demo)'
        };
      }

      const today = new Date().toLocaleDateString('it-IT');
      const downloadLink = prescription.pdfUrl
        ? `${prescription.pdfUrl}`
        : 'Link non disponibile';

      const message = `MedicoSmart: Nuova ricetta medica per ${patient.firstName} ${patient.lastName} del ${today}. Scarica il documento: ${downloadLink}`;

      const result = await this.smsClient.messages.create({
        body: message,
        from: config.sms.phoneNumber,
        to: recipient
      });

      // Aggiorna record comunicazione
      await prisma.communication.update({
        where: { id: communication.id },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      });

      logger.info(`SMS inviato a ${recipient}: ${result.sid}`);

      return {
        id: communication.id,
        type: 'sms',
        recipient,
        messageId: result.sid,
        status: 'sent'
      };
    } catch (error) {
      // Aggiorna record con errore
      await prisma.communication.update({
        where: { id: communication.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      });

      logger.error('Errore invio SMS:', error);
      throw error;
    }
  }

  /**
   * Template HTML per l'email
   */
  getEmailTemplate({ prescription, doctor, patient, today }) {
    return `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ricetta Medica</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #005eb8; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .doctor-info { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .patient-info { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .btn { display: inline-block; background: #005eb8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RICETTA MEDICA</h1>
          </div>
          <div class="content">
            <div class="doctor-info">
              <p><strong>Medico:</strong> ${doctor.title} ${doctor.fullName}</p>
              <p><strong>Specializzazione:</strong> ${doctor.specialization || 'Medico Chirurgo'}</p>
              <p><strong>Studio:</strong> ${doctor.address}</p>
              <p><strong>Tel:</strong> ${doctor.phone}</p>
            </div>
            <div class="patient-info">
              <p><strong>Paziente:</strong> ${patient.firstName} ${patient.lastName}</p>
              <p><strong>Data di nascita:</strong> ${new Date(patient.birthDate).toLocaleDateString('it-IT')}</p>
              <p><strong>Data prescrizione:</strong> ${today}</p>
            </div>
            <p>Gentile paziente,</p>
            <p>Il medico le ha inviato una prescrizione medica. Trova il documento allegato a questa email.</p>
            ${prescription.pdfUrl ? `
            <a href="${prescription.pdfUrl}" class="btn">Scarica PDF</a>
            ` : ''}
          </div>
          <div class="footer">
            <p>Questa comunicazione è inviata da MedicoSmart Pro</p>
            <p>© ${new Date().getFullYear()} MedicoSmart - Tutti i diritti riservati</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new CommunicationService();
