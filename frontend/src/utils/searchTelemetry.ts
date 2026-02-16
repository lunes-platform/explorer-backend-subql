// Search Telemetry — lightweight analytics for search behavior (BL-SEARCH-003)
// Logs to console in dev; can be extended to send to an analytics endpoint.

const STORAGE_KEY = 'lunes-explorer-search-telemetry';
const MAX_ENTRIES = 200;

export interface SearchEvent {
    type: 'query' | 'select' | 'zero_results' | 'abandon';
    query: string;
    resultCount?: number;
    selectedCategory?: string;
    selectedIndex?: number;
    timestamp: number;
}

let buffer: SearchEvent[] = [];

function flush() {
    if (buffer.length === 0) return;
    try {
        const existing: SearchEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const merged = [...existing, ...buffer].slice(-MAX_ENTRIES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
        // localStorage full or unavailable — silently discard
    }
    buffer = [];
}

export function logSearchQuery(query: string, resultCount: number) {
    const event: SearchEvent = {
        type: resultCount === 0 ? 'zero_results' : 'query',
        query,
        resultCount,
        timestamp: Date.now(),
    };
    buffer.push(event);
    if (import.meta.env.DEV) {
        console.debug('[SearchTelemetry]', event.type, { query, resultCount });
    }
    flush();
}

export function logSearchSelect(query: string, category: string, index: number) {
    const event: SearchEvent = {
        type: 'select',
        query,
        selectedCategory: category,
        selectedIndex: index,
        timestamp: Date.now(),
    };
    buffer.push(event);
    if (import.meta.env.DEV) {
        console.debug('[SearchTelemetry]', 'select', { query, category, index });
    }
    flush();
}

export function logSearchAbandon(query: string, resultCount: number) {
    const event: SearchEvent = {
        type: 'abandon',
        query,
        resultCount,
        timestamp: Date.now(),
    };
    buffer.push(event);
    flush();
}

// Utility: get aggregated stats from stored telemetry
export function getSearchStats() {
    try {
        const events: SearchEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const total = events.length;
        const queries = events.filter(e => e.type === 'query' || e.type === 'zero_results');
        const zeroResults = events.filter(e => e.type === 'zero_results');
        const selects = events.filter(e => e.type === 'select');
        const abandons = events.filter(e => e.type === 'abandon');

        return {
            totalEvents: total,
            totalQueries: queries.length,
            zeroResultRate: queries.length > 0 ? (zeroResults.length / queries.length * 100).toFixed(1) + '%' : '0%',
            selectRate: queries.length > 0 ? (selects.length / queries.length * 100).toFixed(1) + '%' : '0%',
            abandonRate: queries.length > 0 ? (abandons.length / queries.length * 100).toFixed(1) + '%' : '0%',
            topZeroQueries: zeroResults.map(e => e.query).slice(-10),
            categoryBreakdown: selects.reduce((acc, e) => {
                const cat = e.selectedCategory || 'unknown';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
        };
    } catch {
        return null;
    }
}
