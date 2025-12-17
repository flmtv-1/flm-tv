# FLM TV - vMix Streaming Configuration Guide
# Alternative Methods for Streaming

## METHOD 1: vMix → Nginx → Web (RECOMMENDED)
===============================================

This is the method we configured above using HLS output.

**Pros:**
- Best compatibility with web browsers
- Low latency
- Works with all devices
- No third-party service needed

**Setup:**
1. vMix outputs HLS to C:\vMix\HLS\
2. Nginx serves HLS files on port 8080
3. Website loads stream from http://flmtv26.duckdns.org:8080/hls/FLMTV.m3u8

---

## METHOD 2: vMix → SRT → Broadcasting
===============================================

For broadcasting to TV stations (Channel 26.5):

**vMix SRT Output Settings:**
- Go to vMix Settings → Output/NDI → Stream
- Add New External Output
- Output Type: SRT (Caller Mode)
- Destination: srt://[TV_STATION_IP]:[PORT]
- Latency: 2000ms
- Key Length: 16 or 32 (if encryption needed)

**For your broadcasting partner:**
- They should run SRT Listener on their receiving equipment
- Stream will be decoded and sent to transmitter

---

## METHOD 3: vMix → RTMP → Multiple Destinations
===============================================

**Simultaneously stream to multiple platforms:**

1. **YouTube Live:**
   - Get Stream Key from YouTube Studio
   - vMix → Add Output → Stream
   - URL: rtmp://a.rtmp.youtube.com/live2/[YOUR_STREAM_KEY]

2. **Facebook Live:**
   - URL: rtmp://live-api-s.facebook.com:80/rtmp/[YOUR_STREAM_KEY]

3. **Custom RTMP Server:**
   - URL: rtmp://flmtv26.duckdns.org:1935/live/flmtv

**Note:** vMix Pro allows multiple simultaneous outputs

---

## METHOD 4: vMix → WebRTC (Ultra Low Latency)
===============================================

For real-time interactive streaming (under 1 second latency):

**Requirements:**
- vMix 4K or Pro version
- WebRTC-compatible player in website

**Setup:**
1. vMix → Settings → Web Controller
2. Enable WebRTC
3. Get WebRTC URL
4. Integrate with website using WebRTC player

---

## METHOD 5: vMix → NDI → Recording/Distribution
===============================================

For internal network distribution:

**vMix NDI Output:**
- vMix automatically broadcasts NDI on local network
- Other devices can receive using NDI Tools (free)
- NDI Recorder can capture streams
- Very low latency (frame-accurate)

**Use Cases:**
- Multi-camera production
- Recording backup streams
- Distribution to other production computers

---

## RECOMMENDED SETUP FOR FLM TV
===============================================

**PRIMARY STREAM (Web/App):**
vMix → HLS → Nginx → Website (Port 8080)
- File: FLMTV.m3u8
- Quality: 1080p @ 5000kbps
- Segments: 4 seconds

**SECONDARY STREAM (TV Broadcast):**
vMix → SRT → Broadcasting Partner → Transmitter → Channel 26.5
- Protocol: SRT Caller
- Latency: 2000ms
- Quality: 1080i @ 8000kbps (broadcast spec)

**BACKUP/ARCHIVE:**
vMix → NDI → NDI Recorder → Local Storage
- Automatic recording of all broadcasts
- Can be uploaded to Jellyfin library later

---

## TROUBLESHOOTING
===============================================

**Stream Not Loading:**
1. Check vMix HLS is running (look for .m3u8 file in C:\vMix\HLS\)
2. Check Nginx is running (http://localhost:8080/hls/FLMTV.m3u8)
3. Check Windows Firewall allows port 8080
4. Check router port forwarding for 8080

**High Latency:**
1. Reduce HLS segment duration to 2-3 seconds
2. Use WebRTC instead of HLS for ultra-low latency
3. Check network bandwidth

**Buffering Issues:**
1. Reduce bitrate in vMix
2. Check internet upload speed
3. Increase HLS segment count in playlist

**Can't Access Externally:**
1. Configure DuckDNS (flmtv26.duckdns.org)
2. Port forward 8080 in router
3. Set static IP for streaming PC
4. Check ISP doesn't block port 8080

---

## PORTS SUMMARY
===============================================

8080  → Nginx HLS streaming (HTTP)
1935  → RTMP (if using RTMP server)
5353  → NDI Discovery
Various → SRT (configurable)
8096  → Jellyfin (your content library)

Make sure all required ports are:
- Allowed in Windows Firewall
- Forwarded in router
- Accessible via DuckDNS domain
