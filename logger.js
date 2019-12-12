import {
  defaultLogger,
} from './common-utils';
import CONFIG from './config';

const logger = defaultLogger(CONFIG.LOGS);

export default logger;
