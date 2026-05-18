const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clean up
  await prisma.auditLog.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@atomquest.com',
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Manager User',
      email: 'manager@atomquest.com',
      role: 'MANAGER',
    },
  });

  const employee = await prisma.user.create({
    data: {
      name: 'Employee User',
      email: 'employee@atomquest.com',
      role: 'EMPLOYEE',
      managerId: manager.id,
    },
  });

  console.log('Database seeded:', { admin, manager, employee });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
