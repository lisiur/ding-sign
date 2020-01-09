import winston from 'winston'

const httpLogPath = process.env.SIGN_HTTP_LOG_PATH ?? './logs/http.log'
const envLogPath = process.env.SIGN_ENV_LOG_PATH ?? './logs/env.log'

const httpLogger = winston.createLogger({
  level: 'http',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple(),
    winston.format.printf(info => 
      winston.format.colorize().colorize(info.level, `${info.timestamp} - ${info.level}: ${info.message}`)
    ),
  ),
  transports: [
    new winston.transports.File({filename: httpLogPath})
  ],
})

const envLogger = winston.createLogger({
  level: 'verbose',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple(),
    winston.format.printf(info => 
      winston.format.colorize().colorize(info.level, `${info.timestamp} - ${info.level}: ${info.message}`)
    ),
  ),
  transports: [
    new winston.transports.File({filename: envLogPath})
  ],
})

if (process.env.NODE_ENV !== 'production') {
  httpLogger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }))
  envLogger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }))
}

export {
  httpLogger,
  envLogger,
}
