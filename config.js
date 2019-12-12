require('dotenv').config(); // eslint-disable-line global-require

const isTrue = x => x === 'true';

const CONFIG = {
  PORT: process.env.PORT || 8000,
  LOGS: {
    access: {
      level: 'info',
      logpath: './logs',
      filename: 'access.log',
      handleExceptions: true,
      shouldConsole: false,
    },
    debug: {
      level: 'debug',
      logpath: './logs',
      filename: 'debug.log',
      handleExceptions: true,
      shouldConsole: isTrue(process.env.DEBUG_LOG_CONSOLE),
    },
    consoleLog: {
      level: 'info',
      shouldConsole: true,
    },
  },
  DEBUG_ERRORS: isTrue(process.env.DEBUG_ERRORS),
};

export default CONFIG;
