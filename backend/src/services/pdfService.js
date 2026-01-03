import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Servizio per la generazione dei PDF delle prescrizioni
 */
class PDFService {
  constructor() {
    this.storagePath = path.join(__dirname, '../../..', config.pdf.storagePath);
    this.ensureStorageDirectory();
  }

  /**
   * Assicura che la directory di storage esista
   */
  ensureStorageDirectory() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * Genera il PDF della prescrizione
   * @param {Object} data - Dati della prescrizione
   * @returns {Object} - URL e hash del PDF
   */
  async generatePrescription({ prescription, doctor, patient }) {
    try {
      const html = this.generateHTML({
        prescription,
        doctor: doctor.profile,
        patient
      });

      // Genera nome file univoco
      const filename = `rx_${patient.lastName}_${prescription.id}.pdf`;
      const filepath = path.join(this.storagePath, filename);

      // Genera il PDF (versione semplificata senza puppeteer per demo)
      // In produzione si userà puppeteer o una libreria PDF
      await this.generatePDFFile(html, filepath);

      // Calcola hash del file
      const fileHash = this.calculateFileHash(filepath);

      // Genera URL pubblico
      const pdfUrl = `${config.pdf.baseUrl}/uploads/pdfs/${filename}`;

      logger.info(`PDF generato: ${filename}`);

      return {
        url: pdfUrl,
        hash: fileHash,
        filename
      };
    } catch (error) {
      logger.error('Errore generazione PDF:', error);
      throw new Error('Errore nella generazione del PDF');
    }
  }

  /**
   * Genera l'HTML per il PDF
   */
  generateHTML({ prescription, doctor, patient }) {
    const today = new Date().toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <title>Ricetta Medica - ${prescription.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #333; }
          .header { background: #005eb8; color: white; padding: 20px; margin-bottom: 20px; }
          .header h1 { font-size: 24px; margin-bottom: 10px; }
          .header .doctor-info { font-size: 10pt; }
          .content { padding: 20px 40px; }
          .patient-info { margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-left: 4px solid #005eb8; }
          .patient-info p { margin: 3px 0; }
          .diagnosis { margin-bottom: 20px; font-style: italic; }
          .prescription { white-space: pre-wrap; font-size: 11pt; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
          .signature { margin-top: 40px; }
          .signature-line { width: 200px; border-top: 1px solid #333; margin-top: 50px; }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(0,0,0,0.05); pointer-events: none; }
        </style>
      </head>
      <body>
        <div class="watermark">RICETTA MEDICA</div>

        <div class="header">
          <h1>RICETTA MEDICA</h1>
          <div class="doctor-info">
            <p><strong>${doctor.title} ${doctor.fullName}</strong></p>
            <p>${doctor.specialization || 'Medico Chirurgo'}</p>
            <p>${doctor.address}</p>
            <p>Tel: ${doctor.phone} | Email: ${doctor.email}</p>
            ${doctor.licenseNumber ? `<p>Ordine dei Medici N. ${doctor.licenseNumber}</p>` : ''}
          </div>
        </div>

        <div class="content">
          <div class="patient-info">
            <p><strong>Paziente:</strong> ${patient.firstName} ${patient.lastName}</p>
            <p><strong>Data di nascita:</strong> ${new Date(patient.birthDate).toLocaleDateString('it-IT')}</p>
            ${patient.fiscalCode ? `<p><strong>Codice Fiscale:</strong> ${patient.fiscalCode}</p>` : ''}
            <p><strong>Data prescrizione:</strong> ${today}</p>
          </div>

          ${prescription.diagnosis ? `
          <div class="diagnosis">
            <p><strong>Diagnosi/Quesito diagnostico:</strong></p>
            <p>${prescription.diagnosis}</p>
          </div>
          ` : ''}

          <div class="prescription">
            <p><strong>PRESCRIZIONE</strong></p>
            <p>${prescription.content}</p>
          </div>

          <div class="footer">
            <p style="font-size: 9pt; color: #666;">
              Documento generato digitalmente - MedicoSmart Pro<br>
              Rx ID: ${prescription.id.toUpperCase()}<br>
              Data: ${today}
            </p>
          </div>

          <div class="signature">
            <p>Data e Firma del Medico</p>
            <div class="signature-line"></div>
            <p>${doctor.title} ${doctor.fullName}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera il file PDF
   * In produzione userà puppeteer per una resa perfetta
   */
  async generatePDFFile(html, filepath) {
    // Per questa versione demo, salviamo come HTML convertito
    // In produzione, si userà: await puppeteer.page.pdf({ format: 'A4', printBackground: true })
    const htmlPath = filepath.replace('.pdf', '.html');
    fs.writeFileSync(htmlPath, html);

    // Simula generazione PDF creando un placeholder
    // In produzione, convertire l'HTML in PDF con puppeteer
    const pdfContent = this.createSimplePDFFile(html);
    fs.writeFileSync(filepath, pdfContent);

    logger.info(`File PDF salvato: ${filepath}`);
  }

  /**
   * Crea un file PDF semplice (versione demo)
   * In produzione usare libreria PDF dedicata
   */
  createSimplePDFFile(html) {
    // PDF minimale per demo - in produzione usare libreria completa
    const pdfHeader = '%PDF-1.4\n';
    const pdfFooter = '\n%%EOF\n';

    // Questo è un placeholder - in produzione generare PDF reale
    const placeholderContent = Buffer.from(html).toString('base64');

    // In realtà, in produzione si userebbe:
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.setContent(html);
    // const pdf = await page.pdf({ format: 'A4', printBackground: true });
    // await browser.close();

    return Buffer.from(`${pdfHeader}
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${placeholderContent.length} >>
stream
${Buffer.from(html).toString()}
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000218 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
${placeholderContent.length + 400}
${pdfFooter}`);
  }

  /**
   * Calcola l'hash SHA-256 del file
   */
  calculateFileHash(filepath) {
    const fileBuffer = fs.readFileSync(filepath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  /**
   * Ottiene il percorso del file PDF
   */
  getFilePath(filename) {
    return path.join(this.storagePath, filename);
  }
}

export default new PDFService();
