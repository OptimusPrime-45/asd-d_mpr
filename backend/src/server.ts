import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { prisma } from './config/prisma.js';

const connectWithRetry = async (retries = 10, delayMs = 2000): Promise<void> => {
  for (let i = 1; i <= retries; i++) {
    try {
      await prisma.$connect();
      logger.info('Connected to the database successfully');
      return;
    } catch (err) {
      logger.warn(`Database connection attempt ${i}/${retries} failed. Retrying in ${delayMs / 1000}s...`);
      if (i === retries) throw err;
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
};

const startServer = async () => {
  try {
    await connectWithRetry();

    app.listen(env.PORT, () => {
      logger.info(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start the server', error);
    process.exit(1);
  }
};

startServer();
