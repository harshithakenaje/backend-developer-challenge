import createError from 'http-errors';
import { body } from 'express-validator/check';
import multer from 'multer';
import path from 'path';
import csv from 'csvtojson';
import { parseAsync } from 'json2csv';
import fs from 'fs';

import { errorFirst as eF, request200 } from '../common-utils/utils';
import { ensurePath } from '../common-utils/file-utils';
import logger from '../logger';

export const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const destPath = path.join(__dirname, '../uploads');
      ensurePath(destPath);
      const dest = path.join(destPath);
      cb(null, dest);
    },
    filename(req, file, cb) {
      const extension = path.extname(file.originalname);
      const filename = `${new Date().toISOString()}_${file.fieldname}${extension}`;
      cb(null, filename);
    },
  }),
});

export const preReport = [
  body('baseCurrency').isString().trim(),
];

const parseCsvToJson = async ({ path: destinationPath = '' } = {}) => {
  if (!destinationPath) {
    throw new Error('Unknown destination path');
  }
  const [err, jsonObj] = await eF(csv({
    noheader: false,
    headers: ['date', 'orderId', 'nonProfit', 'donationCurrency', 'donationAmount', 'fee'],
  }).fromFile(destinationPath));
  if (err) {
    throw err;
  }
  return jsonObj;
};

const convertDonationAmount = ({ rates = [], amount = 0, donationCurrency = '' } = {}) => {
  if (!donationCurrency) {
    return amount;
  }
  if (!rates[donationCurrency]) {
    return amount;
  }
  return amount / (rates[donationCurrency] || 1);
};

const aggregateDonations = (rates = [], donations = []) => {
  const aggData = donations.reduce((a, b) => {
    const {
      nonProfit = '',
      donationAmount = 0,
      donationCurrency = '',
      fee = 0,
    } = b || {};
    if (!nonProfit || !rates[donationCurrency]) {
      return a;
    }
    const convertedDonationAmount = convertDonationAmount({
      rates,
      amount: parseFloat(donationAmount.replace(/,/g, ''), 10).toFixed(2),
      donationCurrency,
    });
    const convertedFee = convertDonationAmount({
      rates,
      amount: parseFloat(fee.replace(/,/g, ''), 10),
      donationCurrency,
    });
    const {
      totalAmount = 0,
      totalFee = 0,
      totalDonations = 0,
    } = a[nonProfit] || {};
    return {
      ...a,
      [nonProfit]: {
        ...(a[nonProfit] || {}),
        totalAmount: totalAmount + convertedDonationAmount,
        totalFee: totalFee + convertedFee,
        totalDonations: totalDonations + 1,
      },
    };
  }, {});

  const aggregation = Object.entries(aggData).map(([key, value]) => ({
    ...value,
    totalAmount: parseFloat(value.totalAmount, 10).toFixed(2),
    totalFee: parseFloat(value.totalFee, 10).toFixed(2),
    nonProfit: key,
  }));
  return aggregation;
};

const generateCSVFile = async (data = []) => {
  const fields = [
    {
      label: 'Non Profit',
      value: 'nonProfit',
    },
    {
      label: 'Total amount',
      value: 'totalAmount',
    },
    {
      label: 'Total Fee',
      value: 'totalFee',
    },
    {
      label: 'Number of Donations',
      value: 'totalDonations',
    },
  ];
  const [err, csvFileData] = await eF(parseAsync(data, { fields }));
  if (err) {
    throw err;
  }
  return csvFileData;
};

export const getReport = async (req, res, next) => {
  const {
    body: {
      baseCurrency = '',
    } = {},
    file: inputCsvFile = {},
  } = req || {};
  const [parseErr, jsonObj] = await eF(parseCsvToJson(inputCsvFile));
  if (parseErr) {
    return next(createError(500, parseErr));
  }
  const [err, { data = {}, statusCode = 500 } = {}] = await eF(request200({
    baseUrl: 'https://api.exchangerate-api.com',
    uri: `/v4/latest/${baseCurrency}`,
  }));
  if (err) {
    return next(createError(500, err));
  }
  if (statusCode < 200 || statusCode >= 400) {
    return next(createError(statusCode, 'Invalid base currency', { expose: false }));
  }
  const convertionRates = JSON.parse(data);
  const aggregatedData = aggregateDonations(convertionRates.rates, jsonObj);
  const [csvGenErr, csvData] = await eF(generateCSVFile(aggregatedData));
  if (csvGenErr) {
    return next(createError(500, parseErr));
  }
  const filename = 'report.csv';
  res.attachment(filename);
  fs.unlink(inputCsvFile.path, (unlinkErr) => {
    if (unlinkErr) {
      logger.debug()(unlinkErr);
    } else {
      logger.debug()('Input file deleted');
    }
  });
  return res.send(csvData);
};
