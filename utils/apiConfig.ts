/// <reference types="vite/client" />
export const getApiUrl = () => {
    // If VITE_API_URL is set (by start-dev.js), use it.
    // Otherwise, assume manual run and default to localhost:3001.
    // We prefer absolute URLs to avoid proxy issues, as CORS is enabled.
    return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};
