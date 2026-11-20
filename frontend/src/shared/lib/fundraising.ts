import { locale } from './i18n';

// Round to one decimal place using integer VND values before formatting.
export function fundraisingPercent(raised: string, goal: string | null): number | null {
    if (!goal || BigInt(goal) <= 0n) return null;
    const target = BigInt(goal);
    return Number((BigInt(raised) * 1000n + target / 2n) / target) / 10;
}

export function formatPercent(percent: number): string {
    return new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(percent) + '%';
}
