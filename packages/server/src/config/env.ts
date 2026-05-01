import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://littysplitty:littysplitty_dev@localhost:5432/littysplitty',
  PORT: parseInt(process.env.PORT || '3001', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  CLIENT_URL_LAN: process.env.CLIENT_URL_LAN || 'http://192.168.1.101:5173',
  PLAID_CLIENT_ID: process.env.PLAID_CLIENT_ID || '',
  PLAID_SECRET: process.env.PLAID_SECRET || '',
  PLAID_ENV: process.env.PLAID_ENV || 'sandbox',
};
