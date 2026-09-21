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