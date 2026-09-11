import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(
  req: IncomingMessage & { method?: string; headers: any; query?: any },
  res: ServerResponse & { status?: (code: number) => any; json?: (body: any) => void }
) {
  try {
    const libraryId = "239218";
    const apiKey = "bbd4e23b-2f03-4adf-92786ad883e4-820f-4d47";

    if (!apiKey) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        success: false, 
        connected: false, 
        message: "Missing API Key in configuration." 
      }));
      return;
    }

    let success = false;
    let message = "";

    // Test via video library videos endpoint
    if (libraryId) {
      try {
        const url = `https://video.bunnycdn.com/library/${libraryId}/videos?page=1&itemsPerPage=1`;
        const response = await fetch(url, {
          headers: {
            "AccessKey": apiKey,
            "Accept": "application/json"
          }
        });
        if (response.ok) {
          success = true;
          message = "Bunny Stream connection successful.";
        } else if (response.status === 401 || response.status === 403) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            success: false, 
            connected: false, 
            message: "Bunny Stream authentication failed. Please check your Library ID and API Access Key." 
          }));
          return;
        }
      } catch (e) {
        // try fallback
      }
    }

    // If not successful yet, test via api.bunny.net/videolibrary
    if (!success) {
      try {
        const listUrl = `https://api.bunny.net/videolibrary`;
        const listRes = await fetch(listUrl, {
          headers: {
            "AccessKey": apiKey,
            "Accept": "application/json"
          }
        });
        if (listRes.ok) {
          success = true;
          message = "Bunny Stream connection successful.";
        } else if (listRes.status === 401 || listRes.status === 403) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            success: false, 
            connected: false, 
            message: "Bunny Stream authentication failed. Please check your Library ID and API Access Key." 
          }));
          return;
        } else {
          message = "Bunny Stream authentication failed. Please check your Library ID and API Access Key.";
        }
      } catch (e) {
        message = "Bunny Stream authentication failed. Please check your Library ID and API Access Key.";
      }
    }

    res.setHeader('Content-Type', 'application/json');
    if (success) {
      res.statusCode = 200;
      res.end(JSON.stringify({ 
        success: true, 
        connected: true, 
        message: "Bunny Stream connection successful." 
      }));
    } else {
      res.statusCode = 401;
      res.end(JSON.stringify({ 
        success: false, 
        connected: false, 
        message: message || "Bunny Stream authentication failed. Please check your Library ID and API Access Key." 
      }));
    }
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      success: false, 
      connected: false, 
      message: "Unable to connect to Bunny Stream.", 
      error: "Internal server error during connection test" 
    }));
  }
}
