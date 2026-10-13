import { env } from '@src/config/env.js';
import { userService } from '@src/modules/user/user.index.js';
import { connectDB } from '@src/shared/database/db.js';
import { USER_ROLES, VALIDATIONS } from '@src/shared/utils/constants.js';
import { logger } from '@src/shared/utils/logger.js';
import mongoose from 'mongoose';

async function seedSuperAdmin(): Promise<void> {
  const { SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD } = env;

  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
    logger.warn(
      '⚠️ Super admin email or password is not configured in env. Skipping seeding.',
    );
    return;
  }

  const existingUser = await userService.findByEmail(SUPER_ADMIN_EMAIL);

  if (existingUser) {
    if (existingUser.role !== USER_ROLES.ADMIN) {
      await userService.updateUserRole(existingUser.id, USER_ROLES.ADMIN);
      logger.info(
        `👑 Existing user (${SUPER_ADMIN_EMAIL}) updated to Super Admin role.`,
      );
    } else {
      logger.info(
        `ℹ️ Super Admin already exists (${SUPER_ADMIN_EMAIL}). Skipping creation.`,
      );
    }
    return;
  }

  await userService.createUser({
    fullName: SUPER_ADMIN_NAME,
    email: SUPER_ADMIN_EMAIL,
    password: SUPER_ADMIN_PASSWORD,
    role: USER_ROLES.ADMIN,
    isEmailVerified: true,
    authProviders: ['local'],
    profileImage: VALIDATIONS.DEFAULT_PROFILE_IMAGE,
  });

  logger.info(`👑 Super Admin seeded successfully: ${SUPER_ADMIN_EMAIL}`);
}

async function run(): Promise<void> {
  try {
    logger.info('🌱 Starting database seeding...');
    await connectDB();
    await seedSuperAdmin();
    logger.info('✅ Database seeding finished successfully.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.fatal({ error }, '❌ Database seeding failed.');
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
}

run();
