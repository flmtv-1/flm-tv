const fetch = require('node-fetch');

const JELLYFIN_SERVER = 'http://flmtv26.duckdns.org:8096';

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const path = event.queryStringParameters.path;
    
    if (!path) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing path parameter' })
      };
    }

    const jellyfinUrl = `${JELLYFIN_SERVER}${path}`;
    console.log('Proxying request to:', jellyfinUrl);

    const response = await fetch(jellyfinUrl, {
      method: event.httpMethod,
      headers: {
        'Accept': 'application/json'
      }
    });

    const contentType = response.headers.get('content-type');
    
    // Handle images
    if (contentType && contentType.includes('image')) {
      const buffer = await response.buffer();
      return {
        statusCode: response.status,
        headers: {
          ...headers,
          'Content-Type': contentType
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true
      };
    }

    // Handle JSON
    const data = await response.json();
    
    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
