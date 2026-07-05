export function optimizeCloudinaryUrl(url: string): string {
  if (!url) return url;
  const idx = url.indexOf('/upload/');
  if (idx === -1) return url;
  const afterUpload = url.slice(idx + 8);
  if (
    afterUpload.startsWith('w_') ||
    afterUpload.includes(',q_') ||
    afterUpload.includes(',f_')
  ) {
    return url;
  }
  return url.slice(0, idx + 8) + 'w_1200,c_limit,q_70,f_jpg/' + afterUpload;
}

export function buildStaticMapUrl(
  lat?: number | null,
  lng?: number | null,
  direccion?: string | null,
  token?: string,
): string {
  if (!token) return '';
  if (lat != null && lng != null) {
    return (
      `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
      `pin-s+0f172a(${lng},${lat})/${lng},${lat},14/400x220?access_token=${token}`
    );
  }
  if (direccion && direccion.trim()) {
    return (
      `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
      `pin-s+0f172a(${encodeURIComponent(direccion)})/auto/400x220?access_token=${token}`
    );
  }
  return '';
}

// PDFKit acepta Buffer directamente en doc.image(), sin necesidad de base64.
export async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  if (!url) return null;
  try {
    const optimized = optimizeCloudinaryUrl(url);
    const res = await fetch(optimized, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch {
    return null;
  }
}

export function isMapboxUrl(url: string): boolean {
  return /mapbox\.com\/styles\/v1\//.test(url);
}

export async function prefetchImages(
  urls: string[],
  batchSize = 8,
  onProgress?: (loaded: number, total: number) => void,
): Promise<Map<string, Buffer>> {
  const cache = new Map<string, Buffer>();
  const unique = [...new Set(urls.filter(Boolean))];
  let loaded = 0;

  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (url) => {
        const buf = await fetchImageBuffer(url);
        return { url, buf };
      }),
    );
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.buf) {
        cache.set(r.value.url, r.value.buf);
      }
      loaded++;
    }
    onProgress?.(loaded, unique.length);
  }

  return cache;
}
