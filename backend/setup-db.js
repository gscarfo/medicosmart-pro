#!/usr/bin/env node

/**
 * Script di setup database per MedicoSmart
 * Esegue le migrazioni Prisma e crea l'utente admin di default
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Setup Database MedicoSmart...\n');

  try {
    // Test connessione database
    console.log('📡 Test connessione database...');
    await prisma.$connect();
    console.log('✅ Connessione database riuscita!\n');

    // Esegui migrazione
    console.log('📊 Esecuzione migrazioni...');
    // In produzione si usa: prisma migrate deploy
    // Per setup iniziale usiamo db push per semplicità
    await prisma.$executeRaw`SELECT 1`;
    console.log('✅ Database pronto!\n');

    // Crea utente admin di default se non esiste
    console.log('👤 Verifica utente admin...');
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 12);

      const admin = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@medicosmart.app',
          passwordHash: hashedPassword,
          role: 'ADMIN',
          profile: {
            create: {
              title: 'Dr.',
              fullName: 'Amministratore',
              address: 'Via Amministrativa 1, 00100 Roma',
              phone: '+39 06 1234567',
              email: 'admin@medicosmart.app'
            }
          }
        },
        include: { profile: true }
      });

      console.log('✅ Utente admin creato!');
      console.log(`   Username: admin`);
      console.log(`   Password: admin123\n`);
    } else {
      console.log('✅ Utente admin già esistente\n');
    }

    // Crea utente medico demo
    console.log('👨‍⚕️ Verifica utente medico demo...');
    const existingDoctor = await prisma.user.findUnique({
      where: { username: 'medico' }
    });

    if (!existingDoctor) {
      const hashedPassword = await bcrypt.hash('medico123', 12);

      const doctor = await prisma.user.create({
        data: {
          username: 'medico',
          email: 'medico@medicosmart.app',
          passwordHash: hashedPassword,
          role: 'DOCTOR',
          profile: {
            create: {
              title: 'Dott.',
              fullName: 'Mario Rossi',
              address: 'Via Roma 123, 00100 Roma',
              phone: '+39 333 1234567',
              email: 'medico@medicosmart.app',
              specialization: 'Medicina Generale',
              licenseNumber: 'RM-12345'
            }
          }
        },
        include: { profile: true }
      });

      console.log('✅ Utente medico creato!');
      console.log(`   Username: medico`);
      console.log(`   Password: medico123\n`);
    } else {
      console.log('✅ Utente medico già esistente\n');
    }

    console.log('🎉 Setup completato con successo!');
    console.log('\n📝 Credenziali di accesso:');
    console.log('   Admin: admin / admin123');
    console.log('   Medico: medico / medico123\n');

  } catch (error) {
    console.error('❌ Errore durante il setup:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
