const suffix = ' · Demo';
export function isDemoName(value: string): boolean {return value.endsWith(suffix);}
export function displayName(value: string): string {return isDemoName(value) ? value.slice(0, -suffix.length) : value;}
