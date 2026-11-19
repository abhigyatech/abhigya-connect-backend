import { PrismaClient, Role } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

async function main() {
  const superadminEmail = 'amoldeshmukh19460@gmail.com';
  const superadminPassword = hashPassword('Test@123');

  await prisma.user.upsert({
    where: { email: superadminEmail },
    update: {
      fullName: 'Amol Deshmukh',
      password: superadminPassword,
      role: Role.SUPERADMIN,
      isVerified: true,
      isActive: true,
    },
    create: {
      fullName: 'Amol Deshmukh',
      email: superadminEmail,
      mobileNumber: '+919876543210',
      password: superadminPassword,
      role: Role.SUPERADMIN,
      isVerified: true,
      isActive: true,
    },
  });

  const clientEmail = 'adarshdhote9926@gmail.com';
  const clientPassword = hashPassword('Test@123');

  await prisma.user.upsert({
    where: { email: clientEmail },
    update: {
      fullName: 'Adarsh Dhote',
      role: Role.CLIENT,
      isVerified: true,
      isActive: true,
    },
    create: {
      fullName: 'Adarsh Dhote',
      email: clientEmail,
      mobileNumber: '+916261439534',
      password: clientPassword,
      role: Role.CLIENT,
      isVerified: true,
      isActive: true,
    },
  });
}

main()
  .catch(() => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
