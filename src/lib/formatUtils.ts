/**
 * Formatting Utilities for Financial Data
 */

/**
 * Formats a number as Brazilian currency (R$)
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Formats a number as a compact currency for large values
 */
export function formatCurrencyCompact(value: number): string {
    if (value >= 1000000) {
        return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return formatCurrency(value);
}

/**
 * Formats a percentage with sign
 */
export function formatPercentage(value: number, showSign: boolean = true): string {
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
}

/**
 * Formats a currency difference with sign
 */
export function formatCurrencyDiff(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign} ${formatCurrency(Math.abs(value))}`;
}
