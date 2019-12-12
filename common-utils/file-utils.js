import fse from 'fs-extra';

/**
 * This function ensures that a given path exists otherwise
 * creates it, if it doesn't exist, errors out and exits the process
 * if it can't create the path.
 * @param {string} path - The path string to be tested.
 */
// eslint-disable-next-line import/prefer-default-export
export const ensurePath = logPath => fse.ensureDir(logPath).catch((err) => {
  console.error(err); // eslint-disable-line
  process.exit(1);
});
