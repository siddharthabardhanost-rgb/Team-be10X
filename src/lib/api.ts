export function getBunnyHeaders(): Record<string, string> {
  const libraryId = localStorage.getItem('bunny_library_id') || '';
  const apiKey = localStorage.getItem('bunny_api_key') || '';
  const tokenKey = localStorage.getItem('bunny_token_key') || '';
  const cdnHostname = localStorage.getItem('bunny_cdn_hostname') || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (libraryId) headers['x-bunny-library-id'] = libraryId;
  if (apiKey) headers['x-bunny-access-key'] = apiKey;
  if (tokenKey) headers['x-bunny-token-key'] = tokenKey;
  if (cdnHostname) headers['x-bunny-cdn-hostname'] = cdnHostname;

  return headers;
}

export async function safeFetch(url: string, options?: RequestInit) {
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...getBunnyHeaders(),
      ...(options?.headers || {}),
    },
  };

  let res: Response;
  try {
    res = await fetch(url, mergedOptions);
  } catch (err) {
    throw new Error("Bunny connection service is unavailable. Please try again.");
  }

  const text = await res.text();
  
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e) {
    if (res.status === 404 || text.includes("<!DOCTYPE") || text.includes("<html") || text.includes("NOT_FOUND")) {
      throw new Error("Bunny connection service is unavailable. Please try again.");
    }
    if (!res.ok) {
      throw new Error(`Server error (${res.status}): ${text.substring(0, 120)}`);
    }
    throw new Error("Invalid server response format (not JSON). Please check server connection.");
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Bunny connection service is unavailable. Please try again.");
    }
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }

  return data;
}
