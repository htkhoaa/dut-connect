export function returnPath(path: unknown, origin = window.location.origin): string | undefined {
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return;
    const url = new URL(path, origin);
    if (url.origin !== origin || ['/login', '/login-admin'].includes(url.pathname)) return;
    return url.pathname + url.search;
}
