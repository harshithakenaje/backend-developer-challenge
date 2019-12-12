import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import uuid from 'uuid/v4';
import debug from 'debug';

export { Router } from 'express';

const myDebugServer = debug('my:server');

morgan.token('id', req => req.id);

const assignRequestId = (req, res, next) => {
  req.id = req.get('x-nginx-request-id') || uuid();
  next();
};

const ok200 = (req, res, next) => {
  res.status(200).send('OK');
};

const logRequestStart = (req, res, next) => {
  myDebugServer(`${req.id}: Request Started: ${req.method} ${req.path}`);
  next();
};

export const createServer = ({ stream } = {}) => {
  const app = express();
  app.use(assignRequestId);
  app.use(logRequestStart);
  app.use(morgan(':id :method :url :response-time', { stream }));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(cookieParser());
  app.use(cors());
  app.use(express.static('public'));
  app.use('/health', ok200);
  return app;
};

export const httpServer = (app, port) => {
  const server = http.createServer(app);
  const onError = (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof port === 'string'
      ? `Pipe: ${port}`
      : `Port: ${port}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        myDebugServer(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        myDebugServer(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  };
  const onListening = () => {
    const addr = server.address();
    myDebugServer(`Magic happens at http://localhost:${addr.port}`);
    const bind = typeof addr === 'string'
      ? `pipe: ${addr}`
      : `port: ${addr.port}`;
    myDebugServer(`Listening on ${bind}`);
  };

  server.on('error', onError);
  server.on('listening', onListening);
  return server;
};
