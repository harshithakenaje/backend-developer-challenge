import { validationResult } from 'express-validator/check';

export const reqValidation = (req, res, next) => {
  try {
    validationResult(req).throw();
    next();
  } catch (err) {
    res.status(422).json({ errors: err.array() });
    next(err);
  }
};
