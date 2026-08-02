// FLM TV — Jellyfin account creation function
// Runs server-side on Netlify. The admin API key lives ONLY here as an
// environment variable — it is never sent to viewers' browsers.
//
// Set this in Netlify: Site settings → Environment variables →
//   JELLYFIN_API_KEY = 62131ee22c0141c6b651be75a7444350

const JELLYFIN_SERVER = 'https://flmtv26.duckdns.org:8920';
// "ENTER FLM" account — used only as a permissions template for new users
const TEMPLATE_USER_ID = '2562494c1df24f8789cd0ad8a38a7bf4';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const ADMIN_API_KEY = process.env.JELLYFIN_API_KEY;
  if (!ADMIN_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured: missing API key' }) };
  }

  let username, password;
  try {
    ({ username, password } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!username || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Username and password are required' }) };
  }
  if (password.length < 6) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Password must be at least 6 characters' }) };
  }

  const authHeader = `MediaBrowser Token="${ADMIN_API_KEY}"`;

  try {
    // 1. Create the new Jellyfin user
    const createRes = await fetch(`${JELLYFIN_SERVER}/Users/New`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
      body: JSON.stringify({ Name: username, Password: password })
    });

    if (!createRes.ok) {
      const detail = await createRes.text();
      const msg = createRes.status === 400
        ? 'That username is already taken. Please choose another.'
        : 'Could not create account.';
      return { statusCode: createRes.status, body: JSON.stringify({ error: msg, detail }) };
    }

    const newUser = await createRes.json();

    // 2. Copy library/feature permissions from the "ENTER FLM" template account
    //    so new viewers get the same show access, without being an admin
    //    or cluttering the login screen.
    const templateRes = await fetch(`${JELLYFIN_SERVER}/Users/${TEMPLATE_USER_ID}`, {
      headers: { 'Authorization': authHeader }
    });

    if (templateRes.ok) {
      const templateUser = await templateRes.json();
      const policy = {
        ...templateUser.Policy,
        IsAdministrator: false,
        IsHidden: true // keeps individual viewer accounts off the public login list
      };

      await fetch(`${JELLYFIN_SERVER}/Users/${newUser.Id}/Policy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify(policy)
      });
    }
    // If the template fetch fails, the new user still exists with Jellyfin's
    // default (safe, non-admin) permissions — it just won't match ENTER FLM's
    // exact library access until policy is set manually.

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, userId: newUser.Id })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error', detail: err.message }) };
  }
};
