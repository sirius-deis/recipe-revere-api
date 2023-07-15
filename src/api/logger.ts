import { createLogger, format, addColors, transports } from 'winston';

const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.json(),
    format.colorize(),
    format.simple(),
    format.timestamp(),
    format.align(),
    format.prettyPrint(),
    format.printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`),
  ),
  transports: [new transports.Console()],
});

addColors({
  info: 'green',
  error: 'red',
  warn: 'orange',
  debug: 'yellow',
});

export default logger;
