import path from 'path';

export const home = async (req, res, next) => {
  res.sendFile(path.join(`${__dirname}/../public/index.html`));
};
