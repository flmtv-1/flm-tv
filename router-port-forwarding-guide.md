# Router Port Forwarding Configuration for FLM TV Streaming

## Required Ports for vMix Streaming
=====================================

Port 8080 (TCP) - Nginx HLS Streaming Server
- Forward to: Your PC's local IP (e.g., 192.168.1.100)
- Protocol: TCP
- Description: FLM TV HLS Stream

## Step-by-Step Setup
=====================

### 1. Find Your PC's Local IP Address
```
Open Command Prompt and type:
ipconfig

Look for "IPv4 Address" under your active network adapter
Example: 192.168.1.100
```

### 2. Set Static IP (IMPORTANT!)
Your PC needs a static IP so port forwarding doesn't break when IP changes.

**Option A - Set in Router (Recommended):**
1. Log into router (usually 192.168.1.1 or 192.168.0.1)
2. Find "DHCP Reservation" or "Address Reservation"
3. Find your PC by name or MAC address
4. Assign static IP (e.g., 192.168.1.100)

**Option B - Set in Windows:**
1. Open Control Panel → Network and Internet → Network Connections
2. Right-click your network adapter → Properties
3. Select "Internet Protocol Version 4 (TCP/IPv4)" → Properties
4. Select "Use the following IP address"
5. Enter:
   - IP address: 192.168.1.100 (or your current IP)
   - Subnet mask: 255.255.255.0
   - Default gateway: 192.168.1.1 (your router's IP)
   - DNS: 8.8.8.8 / 8.8.4.4 (Google DNS)

### 3. Configure Port Forwarding in Router

**Generic Steps (varies by router model):**
1. Log into router admin panel
2. Find "Port Forwarding" or "Virtual Server" section
3. Add new rule:
   ```
   Service Name: FLM-TV-HLS
   External Port: 8080
   Internal Port: 8080
   Internal IP: 192.168.1.100 (your PC's static IP)
   Protocol: TCP
   Status: Enabled
   ```

**Common Router Brands:**

**Netgear:**
- Advanced → Advanced Setup → Port Forwarding/Port Triggering

**TP-Link:**
- Forwarding → Virtual Servers

**Linksys:**
- Connectivity → Port Range Forwarding

**ASUS:**
- WAN → Virtual Server/Port Forwarding

**Cox Panoramic Gateway:**
- Connect → Port Forwarding

### 4. Test Port Forwarding

**From Inside Your Network:**
```
http://localhost:8080/hls/FLMTV.m3u8
http://192.168.1.100:8080/hls/FLMTV.m3u8
```

**From Outside Your Network:**
```
http://[YOUR_PUBLIC_IP]:8080/hls/FLMTV.m3u8
http://flmtv26.duckdns.org:8080/hls/FLMTV.m3u8
```

**Check Your Public IP:**
- Go to: https://whatismyipaddress.com
- Or run in command prompt: `nslookup flmtv26.duckdns.org`

### 5. Test with Port Checker Tool
```
https://www.yougetsignal.com/tools/open-ports/
Enter port: 8080
```

## Troubleshooting
==================

### Port 8080 Not Accessible Externally?

**Check 1: Windows Firewall**
```powershell
# Run in PowerShell as Administrator
New-NetFirewallRule -DisplayName "FLM TV HLS" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
```

**Check 2: Router Firewall**
Some routers have additional firewall settings beyond port forwarding.
Look for "Firewall" or "Security" settings and ensure port 8080 is not blocked.

**Check 3: ISP Blocking**
Some ISPs (like Cox) may block certain ports. If 8080 is blocked, try:
- Port 8081
- Port 8082
- Port 8888

Update both router forwarding AND Nginx config if you change ports.

**Check 4: Double NAT**
If you have a modem AND a router, you may have "Double NAT":
1. Port forward on BOTH devices
2. Or put your router in "Bridge Mode" or "DMZ"

**Check 5: UPnP (Universal Plug and Play)**
Some routers support automatic port forwarding:
1. Enable UPnP in router settings
2. Applications can automatically open ports
3. Check if Nginx supports UPnP (most don't, manual forwarding needed)

## DuckDNS Configuration
========================

Your domain: flmtv26.duckdns.org

### Update DuckDNS with Current IP

**Manual Update:**
```
https://www.duckdns.org/update?domains=flmtv26&token=[YOUR_TOKEN]&ip=
```

**Automatic Update (Windows):**
1. Download DuckDNS Windows client
2. Configure with your domain and token
3. Set to run on Windows startup

**Alternative - PowerShell Script:**
Save as `update-duckdns.ps1` and run on startup:
```powershell
$domain = "flmtv26"
$token = "YOUR_DUCKDNS_TOKEN_HERE"
$url = "https://www.duckdns.org/update?domains=$domain&token=$token&ip="
Invoke-RestMethod -Uri $url
```

## Security Considerations
===========================

### 1. Use HTTPS (Recommended)
Currently using HTTP which is not secure. Consider:
- Setting up Cloudflare Tunnel (free SSL)
- Using Let's Encrypt SSL certificate
- Using a reverse proxy like Caddy (auto-SSL)

### 2. Limit Access (Optional)
In Nginx config, you can restrict access by IP:
```nginx
location /hls/ {
    allow 192.168.1.0/24;  # Local network
    deny all;              # Block everyone else
    # ... rest of config
}
```

### 3. Rate Limiting
Prevent abuse with rate limiting:
```nginx
limit_req_zone $binary_remote_addr zone=streaming:10m rate=10r/s;

location /hls/ {
    limit_req zone=streaming burst=20;
    # ... rest of config
}
```

## Quick Reference
==================

| Service | Local URL | Public URL |
|---------|-----------|------------|
| HLS Stream | http://192.168.1.100:8080/hls/FLMTV.m3u8 | http://flmtv26.duckdns.org:8080/hls/FLMTV.m3u8 |
| Jellyfin | http://192.168.1.100:8096 | http://flmtv26.duckdns.org:8096 |
| vMix Web | http://192.168.1.100:8088 | N/A (internal only) |

**Remember:** Always test locally first, then test externally!
