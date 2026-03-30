import { config } from './config/index.js';
import { getDb } from './db/connection.js';
import { createApp } from './loaders/express.js';
import { logger } from './logger.js';
import { startJobWorker } from './services/job-queue.js';

// Ensure config is loaded (and thus dotenv)
void config;

const app = createApp();

app.listen(config.PORT, () => {
  // Touch DB so it's initialized and data dir exists
  getDb();
  startJobWorker();
  logger.log(`Server listening on http://localhost:${config.PORT}`);
});
