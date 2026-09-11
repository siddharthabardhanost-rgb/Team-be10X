import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";

const app = express();
const PORT = 3000;

app.use(express.json());

function getBunnyConfig(req: express.Request) {
  const libraryId = (req.headers['x-bunny-library-id'] as string) || process.env.BUNNY_LIBRARY_ID || "";
  const apiKey = (req.headers['x-bunny-access-key'] as string) || process.env.BUNNY_API_KEY || "";
  const tokenKey = (req.headers['x-bunny-token-key'] as string) || process.env.BUNNY_TOKEN_KEY || "";
  const cdnHostname = (req.headers['x-bunny-cdn-hostname'] as string) || process.env.BUNNY_CDN_HOSTNAME || "video.bunnycdn.com";
  return { libraryId, apiKey, tokenKey, cdnHostname };
}

function generateTokens(videoId: string, tokenKey: string) {
  if (!tokenKey) return "";
  
  // Expiration: 24 hours from now
  const expires = Math.floor(Date.now() / 1000) + 86400;
  
  // Embed token hash: sha256(securityKey + videoId + expires)
  const hash = crypto.createHash("sha256");
  hash.update(tokenKey + videoId + expires);
  const token = hash.digest("hex");
  
  return `?token=${token}&expires=${expires}`;
}

// Search videos
app.get("/api/videos", async (req, res) => {
  try {
    const { libraryId, apiKey, tokenKey, cdnHostname } = getBunnyConfig(req);
    const { search = "", page = 1, itemsPerPage = 20, orderBy = "date" } = req.query;
    
    if (!apiKey || !libraryId) {
      return res.status(400).json({ error: "Missing Bunny configuration. Please open Settings and enter your Bunny Library ID and API Key." });
    }

    const url = new URL(`https://video.bunnycdn.com/library/${libraryId}/videos`);
    url.searchParams.append("page", String(page));
    url.searchParams.append("itemsPerPage", String(itemsPerPage));
    url.searchParams.append("orderBy", String(orderBy));
    if (search) {
      url.searchParams.append("search", String(search));
    }

    const response = await fetch(url.toString(), {
      headers: {
        "AccessKey": apiKey,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        return res.status(401).json({ error: "Unable to authenticate with Bunny. Please check your API Key and Library ID." });
      }
      return res.status(response.status).json({ error: `Bunny API error (${response.status}): Please verify your configuration.` });
    }

    const data = await response.json();
    
    // Process items to construct URLs
    const items = (data.items || []).map((video: any) => {
      const authQuery = generateTokens(video.guid, tokenKey);
      const host = cdnHostname === 'video.bunnycdn.com' ? 'vz-' + libraryId + '.b-cdn.net' : cdnHostname;
      
      const directPlayUrl = `https://iframe.mediadelivery.net/play/${libraryId}/${video.guid}${authQuery}`;
      const hlsPlaylistUrl = `https://${host}/${video.guid}/playlist.m3u8${authQuery}`;
      const thumbnailUrl = `https://${host}/${video.guid}/${video.thumbnailFileName || 'thumbnail.jpg'}${authQuery}`;
      const previewAnimationUrl = video.hasPreviewAnimation 
        ? `https://${host}/${video.guid}/preview.webp${authQuery}` 
        : null;

      return {
        ...video,
        directPlayUrl,
        hlsPlaylistUrl,
        thumbnailUrl,
        previewAnimationUrl
      };
    });

    res.json({
      ...data,
      items
    });
    
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Test connection
app.get("/api/status", async (req, res) => {
  try {
    const { libraryId, apiKey } = getBunnyConfig(req);
    if (!apiKey || !libraryId) {
      return res.json({ connected: false, message: "Missing API Key or Library ID in configuration." });
    }

    const url = `https://video.bunnycdn.com/library/${libraryId}/videos?page=1&itemsPerPage=1`;
    const response = await fetch(url, {
      headers: {
        "AccessKey": apiKey,
        "Accept": "application/json"
      }
    });

    if (response.ok) {
      res.json({ connected: true, message: "Bunny connection successful." });
    } else {
      res.json({ connected: false, message: "Unable to authenticate with Bunny. Please check credentials." });
    }
  } catch (err: any) {
    res.json({ connected: false, message: err.message || "Error connecting to Bunny API." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
