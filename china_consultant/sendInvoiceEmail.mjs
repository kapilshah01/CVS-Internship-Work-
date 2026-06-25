const RESEND_API_URL = 'https://api.resend.com/emails';

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function buildAttachmentContent(invoiceHtml = '') {
  return Buffer.from(invoiceHtml, 'utf8').toString('base64');
}

export async function processInvoiceEmailRequest(payload, env = process.env) {
  const resendApiKey = env.RESEND_API_KEY;
  const emailFrom = env.EMAIL_FROM;

  const {
    to,
    subject,
    text,
    html,
    invoiceHtml,
    invoiceFilename,
    replyTo,
  } = payload || {};

  if (!to || !subject || !text || !invoiceHtml) {
    return jsonResponse(400, {
      error: 'Missing required fields: to, subject, text, and invoiceHtml are required.',
    });
  }

  if (!resendApiKey || !emailFrom) {
    return jsonResponse(200, {
      success: true,
      demo: true,
      message: 'Demo mode: invoice email marked as sent without external delivery.',
    });
  }

  const resendResponse = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html: html || `<pre>${text}</pre>`,
      reply_to: replyTo || env.EMAIL_REPLY_TO || undefined,
      attachments: [
        {
          filename: invoiceFilename || 'invoice.html',
          content: buildAttachmentContent(invoiceHtml),
        },
      ],
    }),
  });

  const resendData = await resendResponse.json().catch(() => ({}));

  if (!resendResponse.ok) {
    return jsonResponse(resendResponse.status, {
      error: resendData?.message || resendData?.error || 'Failed to send invoice email.',
    });
  }

  return jsonResponse(200, {
    success: true,
    id: resendData?.id || null,
  });
}
