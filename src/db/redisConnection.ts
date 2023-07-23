import { createClient } from 'redis';
import logger from '../api/logger.js';

const client = createClient();

client.on('connect', () => logger.info('Redis client connected'));
client.on('error', logger.error);

export const redisConnect = async () => {
  await client.connect();
};

export const redisDisconnect = async () => {
  await client.disconnect();
};

export const getValue = async (key: string) => {
  const retrievedValue = await client.get(key);
  if (retrievedValue) {
    return JSON.parse(retrievedValue);
  }
  return null;
};

export const setValue = async (key: string, value: any, options: { EX: number }) =>
  await client.set(key, JSON.stringify(value), options);
