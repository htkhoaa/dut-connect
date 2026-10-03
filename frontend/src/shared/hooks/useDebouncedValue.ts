import {useEffect, useState} from 'react';

/** Wait for a short typing pause before changing the server query. */
export function useDebouncedValue<T>(value: T, delay = 300): T {
    const [settled, setSettled] = useState(value);
    useEffect(() => {
        const timeout = window.setTimeout(() => setSettled(value), delay);
        return () => window.clearTimeout(timeout);
    }, [value, delay]);
    return settled;
}
