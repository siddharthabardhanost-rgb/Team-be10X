import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";

const app = express();
const PORT = 3000;

app.use(express.json());

const BUNNY_API_KEY = process.env.BUNNY_API_KEY || "";
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID || "";
const BUNNY_TOKEN_KEY = process.env.BUNNY_TOKEN_KEY || "";
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME || "video.bunnycdn.com"; // default, or iframe.mediadelivery.net

function generateTokens(videoId: string) {
  if (!BUNNY_TOKEN_KEY) return "";
  
  // Expiration: 24 hours from now
  const expires = Math.floor(Date.now() / 1000) + 86400;
  
  // Embed token hash: sha256(securityKey + videoId + expires)
  const hash = crypto.createHash("sha256");
  hash.update(BUNNY_TOKEN_KEY + videoId + expires);
  const token = hash.digest("hex");
  
  return `?token=${token}&expires=${expires}`;
}

// Search videos
app.get("/api/videos", async (req, res) => {
  try {
    const { search = "", page = 1, itemsPerPage = 20, orderBy = "date" } = req.query;
    
    if (!BUNNY_API_KEY || !BUNNY_LIBRARY_ID) {
      return res.status(400).json({ error: "Missing Bunny configuration" });
    }

    const url = new URL(`https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`);
    url.searchParams.append("page", String(page));
    url.searchParams.append("itemsPerPage", String(itemsPerPage));
    url.searchParams.append("orderBy", String(orderBy));
    if (search) {
      url.searchParams.append("search", String(search));
    }

    const response = await fetch(url.toString(), {
      headers: {
        "AccessKey": BUNNY_API_KEY,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        return res.status(401).json({ error: "Unable to authenticate with Bunny. Please check the API configuration." });
      }
      return res.status(response.status).json({ error: "Bunny is currently unavailable. Please try again later." });
    }

    const data = await response.json();
    
    // Process items to construct URLs
    const items = data.items.map((video: any) => {
      const authQuery = generateTokens(video.guid);
      const host = BUNNY_CDN_HOSTNAME === 'video.bunnycdn.com' ? 'vz-' + BUNNY_LIBRARY_ID + '.b-cdn.net' : BUNNY_CDN_HOSTNAME; // Guess the vz host if missing
      
      const directPlayUrl = `https://iframe.mediadelivery.net/play/${BUNNY_LIBRARY_ID}/${video.guid}${authQuery}`;
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
    res.status(500).json({ error: err.message });
  }
});

// Test connection
app.get("/api/status", async (req, res) => {
  try {
    if (!BUNNY_API_KEY || !BUNNY_LIBRARY_ID) {
      return res.json({ connected: false, message: "Missing API Key or Library ID" });
    }

    const url = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}`;
    const response = await fetch(url, {
      headers: {
        "AccessKey": BUNNY_API_KEY,
        "Accept": "application/json"
      }
    });

    if (response.ok) {
      res.json({ connected: true, message: "Bunny connection successful." });
    } else {
      res.json({ connected: false, message: "Unable to authenticate with Bunny." });
    }
  } catch (err) {
    res.json({ connected: false, message: "Error connecting to Bunny API." });
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
