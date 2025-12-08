
// 🧠 luma.js — FLM's AI Assistant: YouTube Search & Metadata Helper

const YOUTUBE_API_KEY = 'AIzaSyBJMZDXDPcVPUFhMKdYrABrke4PQZgRsT8';

async function searchYouTubeTrailer(title) {
  const query = encodeURIComponent(`${title} official trailer`);
  const apiURL = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${query}&type=video&key=${YOUTUBE_API_KEY}`;

  try {
    const res = await fetch(apiURL);
    const data = await res.json();
    const video = data.items[0];

    if (!video) {
      return { error: 'No trailer found' };
    }

    return {
      title: video.snippet.title,
      videoId: video.id.videoId,
      thumbnail: video.snippet.thumbnails.medium.url,
      channel: video.snippet.channelTitle
    };
  } catch (err) {
    console.error("YouTube search error:", err);
    return { error: 'YouTube API error' };
  }
}

// 🎬 Optional: Render the trailer in a div
function displayTrailer(videoData, containerId = "trailerResult") {
  const container = document.getElementById(containerId);
  if (!videoData || videoData.error) {
    container.innerHTML = "<p>No trailer found.</p>";
    return;
  }

  container.innerHTML = `
    <h4>🎞️ ${videoData.title}</h4>
    <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoData.videoId}" frameborder="0" allowfullscreen></iframe>
    <p>📺 Channel: ${videoData.channel}</p>
  `;
}
