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
    
    if (!apiKey) {
      return res.status(400).json({ error: "Missing Bunny API Key. Please open Settings and enter your Bunny API Key." });
    }

    let response: Response | null = null;
    let effectiveLibraryId = libraryId;
    let data: any = null;

    // Try primary endpoint: video.bunnycdn.com
    if (effectiveLibraryId) {
      const url = new URL(`https://video.bunnycdn.com/library/${effectiveLibraryId}/videos`);
      url.searchParams.append("page", String(page));
      url.searchParams.append("itemsPerPage", String(itemsPerPage));
      url.searchParams.append("orderBy", String(orderBy));
      if (search) {
        url.searchParams.append("search", String(search));
      }

      response = await fetch(url.toString(), {
        headers: {
          "AccessKey": apiKey,
          "Accept": "application/json"
        }
      });
    }

    // If 404 or missing libraryId, try listing libraries via api.bunny.net/videolibrary
    if (!response || response.status === 404 || !effectiveLibraryId) {
      const listUrl = `https://api.bunny.net/videolibrary`;
      const listRes = await fetch(listUrl, {
        headers: {
          "AccessKey": apiKey,
          "Accept": "application/json"
        }
      });

      if (listRes.ok) {
        const listData = await listRes.json();
        const libraries = listData.items || listData || [];
        if (Array.isArray(libraries) && libraries.length > 0) {
          // If libraryId was given, try to find matching one, otherwise take first
          const matched = effectiveLibraryId 
            ? libraries.find((l: any) => String(l.Id || l.id) === String(effectiveLibraryId))
            : libraries[0];
          
          const targetLib = matched || libraries[0];
          effectiveLibraryId = String(targetLib.Id || targetLib.id);

          // Now fetch videos from that library
          const url2 = new URL(`https://video.bunnycdn.com/library/${effectiveLibraryId}/videos`);
          url2.searchParams.append("page", String(page));
          url2.searchParams.append("itemsPerPage", String(itemsPerPage));
          url2.searchParams.append("orderBy", String(orderBy));
          if (search) {
            url2.searchParams.append("search", String(search));
          }

          response = await fetch(url2.toString(), {
            headers: {
              "AccessKey": apiKey,
              "Accept": "application/json"
            }
          });
        }
      }
    }

    if (!response || !response.ok) {
      const status = response ? response.status : 400;
      if (status === 401) {
        return res.status(401).json({ error: "Unable to authenticate with Bunny. Please check your API Key and Library ID." });
      }
      return res.status(status).json({ error: `Bunny API error (${status}): Please verify your Library ID and API Key.` });
    }

    data = await response.json();
    
    // Process items to construct URLs
    const items = (data.items || []).map((video: any) => {
      const authQuery = generateTokens(video.guid, tokenKey);
      const host = cdnHostname === 'video.bunnycdn.com' ? 'vz-' + effectiveLibraryId + '.b-cdn.net' : cdnHostname;
      
      const directPlayUrl = `https://iframe.mediadelivery.net/play/${effectiveLibraryId}/${video.guid}${authQuery}`;
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
      libraryId: effectiveLibraryId,
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
    if (!apiKey) {
      return res.json({ connected: false, message: "Missing API Key in configuration." });
    }

    let success = false;
    let message = "";

    // Test via video library videos endpoint
    if (libraryId) {
      const url = `https://video.bunnycdn.com/library/${libraryId}/videos?page=1&itemsPerPage=1`;
      const response = await fetch(url, {
        headers: {
          "AccessKey": apiKey,
          "Accept": "application/json"
        }
      });
      if (response.ok) {
        success = true;
        message = "Bunny Stream connection successful!";
      }
    }

    // If not successful yet, test via api.bunny.net/videolibrary
    if (!success) {
      const listUrl = `https://api.bunny.net/videolibrary`;
      const listRes = await fetch(listUrl, {
        headers: {
          "AccessKey": apiKey,
          "Accept": "application/json"
        }
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        const libs = listData.items || listData || [];
        if (Array.isArray(libs) && libs.length > 0) {
          success = true;
          message = `Connected successfully! Found ${libs.length} video library(ies).`;
        } else {
          success = true;
          message = "Connected successfully, but no video libraries found.";
        }
      } else {
        message = "Unable to authenticate with Bunny. Please check your API Key and Library ID.";
      }
    }

    res.json({ connected: success, message });
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
