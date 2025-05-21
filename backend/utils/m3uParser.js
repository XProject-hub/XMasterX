const fs = require('fs');
const axios = require('axios');
const path = require('path');

class M3UParser {
  constructor() {
    this.channels = [];
  }

  async parseFromFile(filePath, provider) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return this.parseContent(content, provider);
    } catch (error) {
      console.error('Error parsing M3U file:', error);
      throw error;
    }
  }

  async parseFromUrl(url, provider) {
    try {
      const response = await axios.get(url);
      return this.parseContent(response.data, provider);
    } catch (error) {
      console.error('Error fetching M3U from URL:', error);
      throw error;
    }
  }

  async parseFromCredentials(serverUrl, port, username, password, provider) {
    try {
      // Construct URL with credentials
      const url = `http://${username}:${password}@${serverUrl}:${port}/get.php?username=${username}&password=${password}&type=m3u_plus&output=ts`;
      const response = await axios.get(url);
      return this.parseContent(response.data, provider);
    } catch (error) {
      console.error('Error fetching M3U from credentials:', error);
      throw error;
    }
  }

  parseContent(content, provider) {
    this.channels = [];
    const format = this.detectFormat(content);
    const lines = content.split('\n');
    
    let currentChannel = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Check if this is an #EXTINF line (channel info)
      if (line.startsWith('#EXTINF:')) {
        // Extract channel name
        const nameMatch = line.match(/tvg-name="([^"]*)"/) || line.match(/,(.*)$/);
        const name = nameMatch ? nameMatch[1].trim() : 'Unknown Channel';
        
        currentChannel = {
          name,
          provider,
          format,
          url: '',
          isLive: false
        };
      } 
      // If not a comment and we have a current channel, this must be the URL
      else if (!line.startsWith('#') && currentChannel) {
        currentChannel.url = line;
        this.channels.push({...currentChannel});
        currentChannel = null;
      }
    }
    
    return this.channels;
  }

  detectFormat(content) {
    if (content.includes('#EXTM3U')) {
      if (content.includes('#EXT-X-STREAM-INF') || content.includes('#EXT-X-MEDIA')) {
        return 'm3u8';
      }
      return 'm3u';
    }
    
    // Check for common video formats
    const lastLine = content.split('\n').filter(line => !line.startsWith('#') && line.trim()).pop();
    if (lastLine) {
      if (lastLine.endsWith('.mp4')) return 'mp4';
      if (lastLine.endsWith('.ts')) return 'hls';
    }
    
    return 'other';
  }
}

module.exports = new M3UParser();
