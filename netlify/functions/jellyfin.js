export async function handler(event) {
  try {
    const JELLYFIN_BASE = "http://10.0.0.11:8096"; // ← your Jellyfin LAN IP
    const path = event.queryStringParameters.path || "";
    const apiKey = event.queryStringParameters.api_key || "";

    const url = `${JELLYFIN_BASE}${path}${path.includes("?") ? "&" : "?"}api_key=${apiKey}`;

    const res = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });

    const body = await res.text();

    return {
      statusCode: res.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
