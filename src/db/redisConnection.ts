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

export const getValue = async (value: string) => {
  const retrievedValue = await client.get(`bl-${value}`);
  if (retrievedValue) {
    return JSON.parse(retrievedValue);
  }
  return null;
};

export const setValue = async (value: string, options: { EX: number }) =>
  await client.set(`bl-${value}`, JSON.stringify(value), options);
