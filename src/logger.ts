import winston from 'winston'
import dotenv from 'dotenv'

dotenv.config()
const httpLogPath = process.env.SIGN_HTTP_LOG_PATH ?? './logs/http.log'
const envLogPath = process.env.SIGN_ENV_LOG_PATH ?? './logs/env.log'

const format = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY/MM/DD HH:mm:ss'
  }),
  winston.format.simple(),
  winston.format.printf(info => 
    winston.format.colorize().colorize(info.level, `[${info.timestamp}] - [${info.level}]: ${info.message}`)
  ),
)

const httpLogger = winston.createLogger({
  level: 'http',
  format,
  transports: [
    new winston.transports.File({filename: httpLogPath})
  ],
})

const envLogger = winston.createLogger({
  level: 'verbose',
  format,
  transports: [
    new winston.transports.File({filename: envLogPath})
  ],
})

if (process.env.NODE_ENV !== 'production') {
  httpLogger.add(new winston.transports.Console({
    format,
  }))
  envLogger.add(new winston.transports.Console({
    format,
  }))
}

export {
  httpLogger,
  envLogger,
}
