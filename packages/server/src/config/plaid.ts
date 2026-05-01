import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { env } from './env.js';

const envMap: Record<string, string> = {
  sandbox: PlaidEnvironments.sandbox,
  production: PlaidEnvironments.production,
};

const configuration = new Configuration({
  basePath: envMap[env.PLAID_ENV] || PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': env.PLAID_CLIENT_ID,
      'PLAID-SECRET': env.PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);
