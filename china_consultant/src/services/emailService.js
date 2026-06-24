const configuredEmailApiUrl = import.meta.env.VITE_EMAIL_API_URL;

export const resolveEmailApiUrl = () => {
  if (configuredEmailApiUrl?.trim()) {
    return configuredEmailApiUrl.trim();
  }

  if (import.meta.env.DEV) {
    return '/api/send-invoice-email';
  }

  return '/.netlify/functions/send-invoice-email';
};

export async function sendInvoiceEmail(payload) {
  const endpoint = resolveEmailApiUrl();

  if (!endpoint) {
    throw new Error(
      'Email sending is not configured yet. Add VITE_EMAIL_API_URL or deploy a Supabase Edge Function at /send-invoice-email.'
    );
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Failed to send email.');
  }

  return data;
}
