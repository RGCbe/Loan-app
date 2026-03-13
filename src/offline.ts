const CACHE_PREFIX = 'lt_cache_';
const QUEUE_KEY = 'lt_mutation_queue';

interface QueuedMutation {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
}

export function getCachedData<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    // Cache valid for 24 hours
    if (Date.now() - ts > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

export function setCachedData(key: string, data: unknown): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage full — clear old caches
    clearOldCaches();
  }
}

function clearOldCaches(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
  // Remove oldest half
  const entries = keys.map(k => {
    try {
      const { ts } = JSON.parse(localStorage.getItem(k) || '{}');
      return { k, ts: ts || 0 };
    } catch {
      return { k, ts: 0 };
    }
  }).sort((a, b) => a.ts - b.ts);

  const removeCount = Math.ceil(entries.length / 2);
  entries.slice(0, removeCount).forEach(e => localStorage.removeItem(e.k));
}

export function getQueue(): QueuedMutation[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedMutation[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): void {
  const queue = getQueue();
  queue.push({
    ...mutation,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  });
  saveQueue(queue);
}

export async function flushQueue(): Promise<{ success: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;
  const remaining: QueuedMutation[] = [];

  for (const mutation of queue) {
    try {
      const res = await fetch(mutation.url, {
        method: mutation.method,
        headers: mutation.headers,
        body: mutation.body
      });
      if (res.ok) {
        success++;
      } else {
        failed++;
        remaining.push(mutation);
      }
    } catch {
      failed++;
      remaining.push(mutation);
    }
  }

  saveQueue(remaining);
  return { success, failed };
}

/**
 * Wrapper around fetch that:
 * - For GET requests: caches responses in localStorage, serves cache when offline
 * - For mutations (POST/PUT/DELETE): queues when offline for later sync
 */
export async function offlineFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const method = (options?.method || 'GET').toUpperCase();
  const cacheKey = url;

  if (method === 'GET') {
    try {
      const res = await fetch(url, options);
      if (res.ok) {
        const clone = res.clone();
        clone.json().then(data => setCachedData(cacheKey, data)).catch(() => {});
      }
      return res;
    } catch {
      // Offline — serve from cache
      const cached = getCachedData(cacheKey);
      if (cached !== null) {
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-From-Cache': 'true' }
        });
      }
      throw new Error('Offline and no cached data available');
    }
  } else {
    // Mutation
    try {
      return await fetch(url, options);
    } catch {
      // Offline — queue the mutation
      const headers: Record<string, string> = {};
      if (options?.headers) {
        if (options.headers instanceof Headers) {
          options.headers.forEach((v, k) => { headers[k] = v; });
        } else if (Array.isArray(options.headers)) {
          options.headers.forEach(([k, v]) => { headers[k] = v; });
        } else {
          Object.assign(headers, options.headers);
        }
      }
      enqueue({
        url,
        method,
        headers,
        body: options?.body as string | undefined
      });
      // Return a synthetic success response so the UI doesn't break
      return new Response(JSON.stringify({ success: true, queued: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Queued': 'true' }
      });
    }
  }
}
