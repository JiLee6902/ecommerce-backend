
'use strict'
const winston = require('winston')

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS A'
      }),
      winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
    ),
    defaultMeta: { service: 'your-service-name' },
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({
        dirname: 'logs', filename: 'test.log'
      }),
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    ]
  });

module.exports = logger;

