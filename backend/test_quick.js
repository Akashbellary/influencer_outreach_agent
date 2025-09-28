#!/usr/bin/env node

// Quick test script for the enhanced Instagram username extractor
const { spawn } = require('child_process');

const testData = {
  permalinks: [
    "https://www.instagram.com/p/DLZTLrChaF7/",
    "https://www.instagram.com/p/DN9mNdHj_wS/",
    "https://www.instagram.com/p/DOeazpvkpLE/"
  ]
};

console.log('Testing enhanced Instagram username extractor (Selenium-like approach)...');
console.log('Input data:', JSON.stringify(testData, null, 2));

const child = spawn('node', ['node_username_extractor.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Send test data
child.stdin.write(JSON.stringify(testData));
child.stdin.end();

let output = '';
let results = [];

child.stdout.on('data', (data) => {
  const line = data.toString().trim();
  output += line + '\n';
  
  // Parse JSON results
  try {
    const result = JSON.parse(line);
    results.push(result);
    console.log(`Result: ${result.url} -> ${result.username || 'FAILED'}`);
  } catch (e) {
    // Not JSON, ignore
  }
});

child.on('close', (code) => {
  console.log(`\n=== EXTRACTION COMPLETE ===`);
  console.log(`Process finished with code: ${code}`);
  console.log(`Total URLs processed: ${results.length}`);
  
  const successful = results.filter(r => r.username).length;
  const failed = results.filter(r => !r.username).length;
  
  console.log(`✅ Successful extractions: ${successful}`);
  console.log(`❌ Failed extractions: ${failed}`);
  console.log(`📊 Success rate: ${((successful / results.length) * 100).toFixed(1)}%`);
  
  console.log('\n=== RESULTS ===');
  results.forEach((result, index) => {
    const status = result.username ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.username || 'FAILED'} - ${result.url}`);
  });
  
  if (code === 0) {
    console.log('\n🎉 Script executed successfully!');
  } else {
    console.log('\n⚠️ Script finished with errors');
  }
});

child.on('error', (error) => {
  console.error('❌ Failed to start process:', error);
});

// Timeout after 5 minutes for quick test
setTimeout(() => {
  console.log('⏰ Test timeout reached, killing process...');
  child.kill();
}, 300000);