import winston from 'winston';
import path from 'path';
import fs from 'fs-extra';

let loggerInstance: winston.Logger | null = null;

export interface LogOptions {
  level?: string;
  message: string;
  meta?: Record<string, any>;
}

export function configureLogger(userDataPath: string): winston.Logger {
  try {
    const logDir = path.join(userDataPath, 'logs');
    fs.ensureDirSync(logDir);

    loggerInstance = winston.createLogger({
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          maxsize: 5 * 1024 * 1024, // 5MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, stack }) => {
              return `[${timestamp}] [${level}]: ${stack || message}`;
            })
          ),
        }),
      ],
    });

    process.on('uncaughtException', (err: Error) => {
      if (loggerInstance) {
        loggerInstance.error('Uncaught Exception:', err);
      } else {
        console.error('Uncaught Exception:', err);
      }
    });

    process.on('unhandledRejection', (reason: unknown) => {
      if (loggerInstance) {
        loggerInstance.error('Unhandled Rejection:', reason as Error);
      } else {
        console.error('Unhandled Rejection:', reason);
      }
    });

    return loggerInstance;
  } catch (err) {
    console.error('[Logger] Failed to configure logger, using console fallback:', err);
    // Create console fallback logger
    loggerInstance = winston.createLogger({
      transports: [new winston.transports.Console()],
    });
    return loggerInstance;
  }
}

export function getLogger(): winston.Logger {
  if (!loggerInstance) {
    loggerInstance = winston.createLogger({
      transports: [new winston.transports.Console()],
    });
  }
  return loggerInstance;
}

export default {
  configureLogger,
  getLogger,
};
