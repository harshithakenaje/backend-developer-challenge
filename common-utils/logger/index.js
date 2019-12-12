import { createLogger, transports, format } from 'winston';
import path from 'path';
import util from 'util';
import { ensurePath } from '../file-utils';

const {
  combine,
  timestamp,
  printf,
  colorize,
} = format;

const myFormat = printf(info => `${info.timestamp} ${info.level}: ${info.message}`);

/**
 * @private
 * This function takes a winston logger and the level and generates a
 * function for logging directly.
 * @param {function} logInstance - An winston logger instance.
 * @param {string} level - The log level for instance.
 */
// eslint-disable-next-line max-len
const customWriter = (logInstance, level) => (...id) => (...message) => logInstance[level]([...id, util.format(...message)].join(' '));

/**
 * This function takes a winston logger and the level and generates a
 * streamer which can be used for morgan.
 * @param {function} logInstance - An winston logger instance.
 * @param {string} level - The log level for instance.
 */
export const customStream = (logInstance, level) => ({
  write: (...message) => logInstance[level](...message),
});

/**
 * This function generates a winston logger Instance.
 */
export const generateLogger = (logOptions) => {
  const {
    level,
    logpath = './logs',
    filename,
    handleExceptions,
    maxsize,
    tailable,
    maxFiles,
    shouldConsole,
  } = logOptions;
  ensurePath(logpath);
  if (!level) return {};
  const options = {
    level,
    transports: [],
  };
  if (shouldConsole) {
    const consoleTransport = new transports.Console({
      level,
      handleExceptions,
      format: combine(
        timestamp(),
        colorize(),
        myFormat,
      ),
    });
    options.transports.push(consoleTransport);
  }
  if (filename) {
    const persistentTransport = new transports.File({
      name: level,
      level,
      filename: path.join(logpath, filename),
      handleExceptions,
      maxsize,
      tailable,
      maxFiles,
      format: combine(
        timestamp(),
        myFormat,
      ),
    });
    options.transports.push(persistentTransport);
  }
  return createLogger(options);
};


// eslint-disable-next-line import/prefer-default-export
export const defaultLogger = (config) => {
  const {
    debug = {},
    error = {},
    api = {},
    consoleLog = {},
    access = {},
  } = config;
  const debugLogs = generateLogger(debug);
  const errorLogs = generateLogger(error);
  const apiLogs = generateLogger(api);
  const consoleLogs = generateLogger(consoleLog);
  const accessLogs = generateLogger(access);
  return {
    debug: customWriter(debugLogs, debug.level),
    error: customWriter(errorLogs, error.level),
    api: customWriter(apiLogs, api.level),
    log: customWriter(consoleLogs, consoleLog.level),
    access: customStream(accessLogs, access.level),
  };
};
