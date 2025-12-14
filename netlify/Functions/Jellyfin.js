// Netlify Function to proxy Jellyfin API requests
// This solves the HTTPS -> HTTP mixed content problem

const JELLYFIN_SERVER = 'http://flmtv26.duckdns.org:8096';

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Get the path from query parameter
    const path = event.queryStringParameters.path || '';
    
    // Build the full Jellyfin URL
    const jellyfinUrl = `${JELLYFIN_SERVER}${path}`;
    
    console.log('Proxying request to:', jellyfinUrl);
    
    // Fetch from Jellyfin
    const response = await fetch(jellyfinUrl);
    const data = await response.json();
    
    return {
      statusCode: 200,
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
      body: JSON.stringify({ 
        error: 'Failed to fetch from Jellyfin',
        message: error.message 
      })
    };
  }
};
