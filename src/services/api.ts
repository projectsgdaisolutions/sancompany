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