import jsPDF from 'jspdf';

// Genera il PDF della prescrizione medica
export const generatePrescriptionPDF = (prescription, doctor, patient, onComplete) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Colori
  const primaryColor = [0, 94, 184]; // #005eb8
  const textColor = [30, 41, 59];
  const grayColor = [100, 116, 139];

  // Header con dati del medico
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Titolo "RICETTA MEDICA"
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RICETTA MEDICA', margin, 18);

  // Dati del medico
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const doctorInfo = [
    doctor.title + ' ' + doctor.fullName,
    doctor.address,
    'Tel: ' + doctor.phone + ' | Email: ' + doctor.email
  ];

  doctorInfo.forEach((line, index) => {
    doc.text(line, margin, 25 + (index * 4));
  });

  yPos = 50;

  // Linea di separazione
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Dati paziente
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');

  const today = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  doc.text('Paziente: ' + patient.firstName + ' ' + patient.lastName, margin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('Data di nascita: ' + formatDate(patient.birthDate), margin, yPos);
  yPos += 6;
  doc.text('Data prescrizione: ' + today, margin, yPos);
  yPos += 10;

  // Eventuale codice fiscale
  if (patient.fiscalCode) {
    doc.setFontSize(9);
    doc.setTextColor(...grayColor);
    doc.text('Codice Fiscale: ' + patient.fiscalCode, margin, yPos);
    yPos += 10;
  }

  // Contenuto della prescrizione
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESCRIZIONE', margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const prescriptionLines = prescription.content.split('\n');
  prescriptionLines.forEach(line => {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    const lines = doc.splitTextToSize(line, pageWidth - (margin * 2));
    lines.forEach(textLine => {
      doc.text(textLine, margin, yPos);
      yPos += 6;
    });
  });

  // Linea firma
  yPos = pageHeight - 50;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, margin + 60, yPos);

  yPos += 5;
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text('Firma del medico', margin, yPos);

  // Footer con timbro e data
  doc.setFontSize(9);
  doc.text(today, pageWidth - margin - 25, yPos);

  // Numero progressivo (simulato)
  doc.setFontSize(8);
  doc.text('Rx N. ' + prescription.id.substring(0, 10).toUpperCase(), margin, pageHeight - 15);

  // Note legali
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Documento generato digitalmente - MedicoSmart', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Restituisci il blob per l'invio
  if (onComplete) {
    const pdfBlob = doc.output('blob');
    onComplete(pdfBlob);
  }

  return doc;
};

// Formatta la data per la visualizzazione
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Formatta la data per l'input
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// Stampa il PDF
export const printPDF = (doc) => {
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(pdfUrl, '_blank');

  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

// Scarica il PDF
export const downloadPDF = (doc, filename) => {
  doc.save(filename || 'ricetta.pdf');
};
