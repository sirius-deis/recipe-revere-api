import dotenv from 'dotenv';
dotenv.config();
import mongoose, { ConnectOptions } from 'mongoose';
import logger from '../api/logger.js';

const { DB_NAME } = process.env;

type ConnectionOptionsExtend = {
  useNewUrlParser: boolean;
  useUnifiedTopology: boolean;
};

const options: ConnectOptions & ConnectionOptionsExtend = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connect = async () => {
  mongoose.set('debug', (collectionName: string, method: string, query: string, doc: string) =>
    logger.debug(`${collectionName}.${method}: ${JSON.stringify(query)}, ${doc}`),
  );

  mongoose.connection
    .on('open', () => logger.info('Connection with DB established'))
    .on('close', () => logger.info('Connection with DB closed'))
    .on('error', logger.error);

  await mongoose.connect(`mongodb://localhost:27017/${DB_NAME}`, options);
};

export default connect;
