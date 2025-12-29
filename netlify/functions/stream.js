// Netlify Function to proxy FLM TV HLS stream
// This serves the stream over HTTPS so it works on your HTTPS website

exports.handler = async function(event, context) {
    const streamUrl = 'http://flmtv26.duckdns.org:8080/FLMTV.m3u8';
    
    try {
        // Fetch the stream from your local server
        const response = await fetch(streamUrl);
        
        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: 'Stream not available' })
            };
        }
        
        const streamData = await response.text();
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.mpegurl',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
            },
            body: streamData
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch stream', details: error.message })
        };
    }
};
