import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';

function generateTokens(videoId: string, tokenKey: string) {
  if (!tokenKey) return "";
  try {
    const expires = Math.floor(Date.now() / 1000) + 86400;
    const hash = crypto.createHash("sha256");
    hash.update(tokenKey + videoId + expires);
    const token = hash.digest("hex");
    return `?token=${token}&expires=${expires}`;
  } catch (e) {
    return "";
  }
}

export default async function handler(
  req: IncomingMessage & { method?: string; headers: any; url?: string },
  res: ServerResponse & { status?: (code: number) => any; json?: (body: any) => void }
) {
  try {
    const libraryId = (req.headers['x-bunny-library-id'] || process.env.BUNNY_LIBRARY_ID || "").toString().trim();
    const apiKey = (req.headers['x-bunny-access-key'] || process.env.BUNNY_API_KEY || "").toString().trim();
    const tokenKey = (req.headers['x-bunny-token-key'] || process.env.BUNNY_TOKEN_KEY || "").toString().trim();
    const cdnHostname = (req.headers['x-bunny-cdn-hostname'] || process.env.BUNNY_CDN_HOSTNAME || "video.bunnycdn.com").toString().trim();

    if (!apiKey) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: "Missing Bunny API Key. Please open Settings and enter your Bunny API Key." }));
      return;
    }

    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const search = urlObj.searchParams.get("search") || "";
    const page = urlObj.searchParams.get("page") || "1";
    const itemsPerPage = urlObj.searchParams.get("itemsPerPage") || "20";
    const orderBy = urlObj.searchParams.get("orderBy") || "date";

    let response: Response | null = null;
    let effectiveLibraryId = libraryId;

    if (effectiveLibraryId) {
      try {
        const url = new URL(`https://video.bunnycdn.com/library/${effectiveLibraryId}/videos`);
        url.searchParams.append("page", page);
        url.searchParams.append("itemsPerPage", itemsPerPage);
        url.searchParams.append("orderBy", orderBy);
        if (search) url.searchParams.append("search", search);

        response = await fetch(url.toString(), {
          headers: {
            "AccessKey": apiKey,
            "Accept": "application/json"
          }
        });
      } catch (e) {}
    }

    if (!response || response.status === 404 || !effectiveLibraryId) {
      try {
        const listRes = await fetch("https://api.bunny.net/videolibrary", {
          headers: {
            "AccessKey": apiKey,
            "Accept": "application/json"
          }
        });

        if (listRes.ok) {
          const listData = await listRes.json();
          const libraries = listData.items || listData || [];
          if (Array.isArray(libraries) && libraries.length > 0) {
            const matched = effectiveLibraryId 
              ? libraries.find((l: any) => String(l.Id || l.id) === String(effectiveLibraryId))
              : libraries[0];
            
            const targetLib = matched || libraries[0];
            effectiveLibraryId = String(targetLib.Id || targetLib.id);

            const url2 = new URL(`https://video.bunnycdn.com/library/${effectiveLibraryId}/videos`);
            url2.searchParams.append("page", page);
            url2.searchParams.append("itemsPerPage", itemsPerPage);
            url2.searchParams.append("orderBy", orderBy);
            if (search) url2.searchParams.append("search", search);

            response = await fetch(url2.toString(), {
              headers: {
                "AccessKey": apiKey,
                "Accept": "application/json"
              }
            });
          }
        }
      } catch (e) {}
    }

    if (!response || !response.ok) {
      const status = response ? response.status : 400;
      res.statusCode = status === 401 ? 401 : status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Bunny API error (${status}): Please verify your Library ID and API Key.` }));
      return;
    }

    const data = await response.json();
    const items = (data.items || []).map((video: any) => {
      const authQuery = generateTokens(video.guid, tokenKey);
      const host = cdnHostname === 'video.bunnycdn.com' ? 'vz-' + effectiveLibraryId + '.b-cdn.net' : cdnHostname;
      
      return {
        ...video,
        directPlayUrl: `https://iframe.mediadelivery.net/play/${effectiveLibraryId}/${video.guid}${authQuery}`,
        hlsPlaylistUrl: `https://${host}/${video.guid}/playlist.m3u8${authQuery}`,
        thumbnailUrl: `https://${host}/${video.guid}/${video.thumbnailFileName || 'thumbnail.jpg'}${authQuery}`,
        previewAnimationUrl: video.hasPreviewAnimation ? `https://${host}/${video.guid}/preview.webp${authQuery}` : null
      };
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      ...data,
      libraryId: effectiveLibraryId,
      items
    }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || "Internal server error" }));
  }
}
