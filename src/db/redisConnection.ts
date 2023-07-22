import { createClient } from 'redis';
import logger from 'src/api/logger';

const client = createClient();

client.on('connect', () => logger.info('Redis client connected'));
client.on('error', logger.error);

export const redisConnect = () => {
  client.connect();
};

export const redisDisconnect = () => {
  client.disconnect();
};

export const getValue = async (key: string, value: string) => {
  const retrievedValue = await client.get(`${key}-${value}`);
  if (retrievedValue) {
    return JSON.parse(retrievedValue);
  }
  return null;
};

export const setValue = async (key: string, value: string, options: { EX: number }) =>
  await client.set(`${key}-${value}`, JSON.stringify(value), options);
