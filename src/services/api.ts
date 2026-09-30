const configuredApiBase = import.meta.env.VITE_PHP_API_URL || '';

export const API_URL = configuredApiBase
    .replace(/\/+$/, '')
    .replace(/\/api$/i, '');

export function apiUrl(endpoint: string): string {
    const path = endpoint.replace(/^\/+/, '');
    return `${API_URL}/${path}`;
}

export function buildApiUrl(baseUrl: string, endpoint: string): string {
    const base = baseUrl.replace(/\/+$/, '').replace(/\/api$/i, '');
    const path = endpoint.replace(/^\/+/, '');
    return `${base}/${path}`;
}

const inFlightApiJsonRequests = new Map<string, Promise<unknown>>();

export function fetchApiJson<T = any>(url: string, endpoint: string, init: RequestInit = {}): Promise<T> {
    const existingRequest = inFlightApiJsonRequests.get(url);
    if (existingRequest) {
        return existingRequest as Promise<T>;
    }

    const request = fetch(url, {
        ...init,
        cache: init.cache ?? 'no-store',
    })
        .then(async response => {
            if (!response.ok) {
                throw new Error(`${endpoint} API returned HTTP ${response.status}.`);
            }
            return readApiJson<T>(response, endpoint);
        })
        .finally(() => {
            if (inFlightApiJsonRequests.get(url) === request) {
                inFlightApiJsonRequests.delete(url);
            }
        });

    inFlightApiJsonRequests.set(url, request);
    return request;
}

export async function readApiJson<T = any>(response: Response, endpoint: string): Promise<T> {
    const contentType = response.headers.get('content-type') || '';
    const body = await response.text();

    if (!contentType.toLowerCase().includes('application/json')) {
        throw new Error(`${endpoint} API returned a non-JSON response (${response.status}).`);
    }

    if (!body.trim()) {
        throw new Error(`${endpoint} API returned an empty response (${response.status}).`);
    }

    try {
        return JSON.parse(body) as T;
    } catch {
        throw new Error(`${endpoint} API returned an invalid response (${response.status}).`);
    }
}