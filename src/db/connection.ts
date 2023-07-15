import mongoose, { ConnectOptions } from 'mongoose';
import logger from 'src/api/logger';

const { DB_NAME } = process.env;

type ConnectionOptionsExtend = {
  useNewUrlParser: boolean;
  useUnifiedTopology: boolean;
};

const options: ConnectOptions & ConnectionOptionsExtend = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connect = () => {
  mongoose.connect(`mongodb://localhost:27017/${DB_NAME}`, options);

  mongoose.set('debug', (collectionName: string, method: string, query: string, doc: string) => {});

  mongoose.connection
    .on('open', () => logger.info('Connection with DB established'))
    .on('close', () => logger.info('Connection with DB closed'))
    .on('error', logger.error);
};

module.exports = connect;
