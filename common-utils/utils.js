import request from 'request';

/**
 * Exposes function that takes up the burden of try catch block .
 * @param {function} [func] - The request handler without try catches.
 * @returns {function} - Promise that takes care of errors
 * @example
 * import { reqErrorHandle as rEH } from 'common-utils';
 *
 * const testHandler = async (req, res, next) => {
 *   const {
 *     data
 *   } = req.body; // This will throw the error unable to find data of undefined if
 *                 // req.body is undefined
 *   res.send({ data });
 * };
 *
 * app.get('/test', rEH(testHandler));
 *
 */
export const reqErrorHandle = func => (req, res, next) => {
  Promise.resolve(func(req, res, next)).catch(next);
};

/**
 * Exposes function resolves every promise in error first pattern.
 * @param {Promise} [promise] - A normal promise which differentiates between resolve and reject .
 * @returns {Promise} - Promise that always resolves
 * @example
 * import { errorFirst as eF } from 'common-utils';
 *
 * const isGreaterThan10 = (input) => {
 *   const integerValue = parseInt(input, 10);
 *   if (integerValue === integerValue) return Promise.resolve(integerValue > 10);
 *   return Promise.reject('Cant typecast to integer');
 * };
 *
 * const reqHandle = async (req, res, next) => {
 *   const { data } = req.body || {};
 *   const [error, data] = await eF(isGreaterThan10(data));
 *   if (error) return res.status(500).end(); // send useful error messages
 *   return res.send(data);
 * };
 *
 */
export const errorFirst = promise => promise.then(x => ([null, x])).catch(x => ([x]));

export const request200 = (options, req, res) => {
  const option = {
    ...options,
    headers: {
      ...options.headers,
    },
  };
  return new Promise((resolve, reject) => {
    request(option, (error, response, body) => {
      if (!error) {
        resolve({ data: body, statusCode: response.statusCode });
      } else {
        reject(error);
      }
    }).on('error', (error) => {
      reject(error);
    });
  });
};
