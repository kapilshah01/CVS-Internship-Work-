import { processInvoiceEmailRequest } from '../../email/sendInvoiceEmail.mjs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed.' }),
    };
  }

  const payload = event.body ? JSON.parse(event.body) : {};
  return processInvoiceEmailRequest(payload, process.env);
}
