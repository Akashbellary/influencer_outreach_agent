#!/usr/bin/env node
// Test script to verify web scraping toggle functionality

let fetch;
try {
  fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
} catch (e) {
  console.error('node-fetch import failed:', e);
}

async function testWebScrapingToggle() {
  const baseUrl = 'http://127.0.0.1:8000';
  
  console.log('Testing Web Scraping Toggle Functionality...\n');
  
  try {
    // Test 1: Get current web scraping setting (should return default true for unauthenticated)
    console.log('1. Testing GET /api/settings/web-scraping...');
    const getResponse = await fetch(`${baseUrl}/api/settings/web-scraping`);
    const getData = await getResponse.json();
    console.log('Response:', JSON.stringify(getData, null, 2));
    
    // Test 2: Test discovery with web scraping disabled
    console.log('\n2. Testing discovery with web scraping disabled...');
    const discoveryResponse = await fetch(`${baseUrl}/start-discovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hashtag: 'test',
        web_scraping_enabled: false
      })
    });
    const discoveryData = await discoveryResponse.json();
    console.log('Discovery response:', JSON.stringify(discoveryData, null, 2));
    
    if (discoveryData.success && discoveryData.job_id) {
      // Test 3: Check discovery status
      console.log('\n3. Checking discovery status...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch(`${baseUrl}/discovery-status/${discoveryData.job_id}`);
      const statusData = await statusResponse.json();
      console.log('Status response:', JSON.stringify(statusData, null, 2));
    }
    
    console.log('\n✅ Web scraping toggle test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

testWebScrapingToggle();