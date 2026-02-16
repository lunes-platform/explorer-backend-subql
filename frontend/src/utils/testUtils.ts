/**
 * Test utilities for Lunes Explorer
 * Run these in browser console to verify functionality
 */

export const runTests = () => {
  const results: string[] = [];
  
  // Test 1: localStorage persistence
  const testLocalStorage = () => {
    try {
      const testKey = 'lunes-test-' + Date.now();
      const testData = { test: true, timestamp: Date.now() };
      
      localStorage.setItem(testKey, JSON.stringify(testData));
      const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
      localStorage.removeItem(testKey);
      
      if (retrieved.test === true) {
        results.push('✅ localStorage: OK');
        return true;
      }
      results.push('❌ localStorage: Failed');
      return false;
    } catch (e) {
      results.push('❌ localStorage: Error - ' + (e as Error).message);
      return false;
    }
  };
  
  // Test 2: Watchlist persistence
  const testWatchlist = () => {
    const key = 'lunes-explorer-watchlist';
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const count = parsed.length || 0;
        results.push(`✅ Watchlist: ${count} items saved`);
        return true;
      } catch {
        results.push('❌ Watchlist: Invalid data');
        return false;
    }
    results.push('⚠️ Watchlist: Empty (no items yet)');
    return true;
  };
  
  // Test 3: Price Alerts persistence
  const testPriceAlerts = () => {
    const key = 'lunes-explorer-price-alerts';
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const active = parsed.filter((a: any) => a.active).length;
        const triggered = parsed.filter((a: any) => a.triggeredAt).length;
        results.push(`✅ Price Alerts: ${active} active, ${triggered} triggered`);
        return true;
      } catch {
        results.push('❌ Price Alerts: Invalid data');
        return false;
      }
    }
    results.push('⚠️ Price Alerts: Empty (no alerts yet)');
    return true;
  };
  
  // Test 4: Project Verification persistence
  const testProjectVerification = () => {
    const key = 'lunes-explorer-project-verifications';
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const count = parsed.length || 0;
        results.push(`✅ Project Verifications: ${count} requests saved`);
        return true;
      } catch {
        results.push('❌ Project Verifications: Invalid data');
        return false;
      }
    }
    results.push('⚠️ Project Verifications: Empty (no requests yet)');
    return true;
  };
  
  // Run all tests
  testLocalStorage();
  testWatchlist();
  testPriceAlerts();
  testProjectVerification();
  
  console.log('🧪 Lunes Explorer Tests\n' + results.join('\n'));
  return results;
};

// CSV Export test
export const testCSVExport = (data: any[], filename: string) => {
  try {
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => 
      Object.values(row).map(v => 
        typeof v === 'string' && v.includes(',') ? `"${v}"` : v
      ).join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    console.log(`✅ CSV Export: ${filename} - ${data.length} rows ready`);
    console.log('Download URL:', url);
    return { success: true, url, rowCount: data.length };
  } catch (e) {
    console.log('❌ CSV Export failed:', (e as Error).message);
    return { success: false, error: (e as Error).message };
  }
};

// Usage:
// import { runTests, testCSVExport } from './utils/testUtils';
// runTests();
