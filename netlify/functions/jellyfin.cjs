// jellyfin-auth.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { username, password, action } = JSON.parse(event.body);
    const JELLYFIN_URL = 'http://flmtv.duckdns.org:8096';

    if (action === 'login') {
      const response = await fetch(`${JELLYFIN_URL}/Users/AuthenticateByName`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Emby-Authorization': 'MediaBrowser Client="FLM TV", Device="Web", DeviceId="flmtv-web-app", Version="1.0.0"'
        },
        body: JSON.stringify({
          Username: username,
          Pw: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            accessToken: data.AccessToken,
            userId: data.User.Id,
            userName: data.User.Name,
            serverId: data.ServerId
          })
        };
      } else {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Invalid username or password'
          })
        };
      }
    }

  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Authentication failed. Please try again.'
      })
    };
  }
};