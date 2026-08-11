// FLM TV — "Forgot Password" step 1: request a reset link
// Looks up the Jellyfin account by email, then emails a signed, time-limited
// reset link via Resend. Runs server-side on Netlify.
//
// Netlify env vars required (in addition to JELLYFIN_API_KEY):
//   RESEND_API_KEY     = your Resend API key
//   RESET_TOKEN_SECRET = any long random string — used to sign reset tokens
//   SITE_URL           = https://flmtv.com   (used to build the reset link)

const crypto = require('crypto');

const JELLYFIN_SERVER = 'https://flmtv26.duckdns.org:8920';
const TOKEN_LIFETIME_MS = 60 * 60 * 1000; // 1 hour

function b64url(input) {
  return Buffer.from(input).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function signToken(payloadObj, secret) {
  const payload = b64url(JSON.stringify(payloadObj));
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${payload}.${sig}`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const ADMIN_API_KEY = process.env.JELLYFIN_API_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const RESET_SECRET = process.env.RESET_TOKEN_SECRET;
  const SITE_URL = process.env.SITE_URL || 'https://flmtv.com';

  if (!ADMIN_API_KEY || !RESEND_API_KEY || !RESET_SECRET) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured: missing required environment variables' }) };
  }

  let email;
  try {
    ({ email } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }
  email = (email || '').trim().toLowerCase();

  // Always return the same generic response whether or not the email is
  // registered — this avoids leaking which emails have FLM TV accounts.
  const genericResponse = {
    statusCode: 200,
    body: JSON.stringify({ success: true, message: 'If that email has an account, a reset link is on its way.' })
  };

  if (!email) return genericResponse;

  const authHeader = `MediaBrowser Token="${ADMIN_API_KEY}"`;

  try {
    // 1. Look up the account — email IS the Jellyfin username at signup time
    const usersRes = await fetch(`${JELLYFIN_SERVER}/Users`, {
      headers: { 'Authorization': authHeader }
    });
    if (!usersRes.ok) return genericResponse;

    const users = await usersRes.json();
    const match = users.find(u => (u.Name || '').toLowerCase() === email);
    if (!match) return genericResponse; // don't reveal non-existence

    // 2. Build a signed, expiring token — no database needed
    const token = signToken({ uid: match.Id, email, exp: Date.now() + TOKEN_LIFETIME_MS }, RESET_SECRET);
    const resetLink = `${SITE_URL}/reset-password.html?token=${encodeURIComponent(token)}`;

    // 3. Email it via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'FLM TV <accounts@flmtv.com>',
        to: email,
        subject: 'Reset your FLM TV password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h2 style="color:#C9A84C;">FLM TV Network</h2>
            <p>We got a request to reset your FLM TV account password. This link expires in 1 hour.</p>
            <p style="margin:28px 0;">
              <a href="${resetLink}" style="background:#C9A84C;color:#000;padding:12px 24px;text-decoration:none;border-radius:4px;font-weight:bold;">Reset Password</a>
            </p>
            <p style="color:#888;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `
      })
    });

    if (!emailRes.ok) {
      const detail = await emailRes.text();
      console.error('Resend error:', detail);
      // Still return the generic success message to the client
    }

    return genericResponse;

  } catch (err) {
    console.error('Forgot-password error:', err.message);
    return genericResponse;
  }
};
