#!/usr/bin/env node

// Test script for the Instagram username extractor
const { spawn } = require('child_process');

const testData = {
  permalinks: [
    "https://www.instagram.com/p/DLZTLrChaF7/",
    "https://www.instagram.com/p/DN9mNdHj_wS/",
    "https://www.instagram.com/p/DOeazpvkpLE/",
    "https://www.instagram.com/p/DMg1IAYz5h9/",
    "https://www.instagram.com/p/DHgasLzuIPO/",
    "https://www.instagram.com/p/CrVmaO5sdZx/",
    "https://www.instagram.com/p/C0taUMMq4Y0/",
    "https://www.instagram.com/p/Cy7icXer3GD/",
    "https://www.instagram.com/p/CwZfNhmAe3x/",
    "https://www.instagram.com/p/DHAr4CcSVHP/",
    "https://www.instagram.com/p/CziitaquteU/",
    "https://www.instagram.com/p/DMUPiU7PseW/",
    "https://www.instagram.com/p/DNxit5C1Bzb/",
    "https://www.instagram.com/p/CyK9V9ax838/",
    "https://www.instagram.com/p/C0omHeFA3ef/",
    "https://www.instagram.com/p/Cwm0fiBL390/",
    "https://www.instagram.com/p/DKmYJrMNJ9z/",
    "https://www.instagram.com/p/C0ahZhGgSMi/",
    "https://www.instagram.com/p/DMvlVvNR-dC/",
    "https://www.instagram.com/p/C0frzfFA6wx/",
    "https://www.instagram.com/p/CzObiV0ABTs/",
    "https://www.instagram.com/p/Cvnw0BOMj_x/",
    "https://www.instagram.com/p/CzRO-yGA7xQ/",
    "https://www.instagram.com/p/CzkHv9YgOE_/",
    "https://www.instagram.com/p/DKfpFo3o-qX/"
  ]
};

console.log('Testing Instagram username extractor...');
console.log('Input data:', JSON.stringify(testData));

const child = spawn('node', ['node_username_extractor.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Send test data
child.stdin.write(JSON.stringify(testData));
child.stdin.end();

let output = '';
child.stdout.on('data', (data) => {
  output += data.toString();
  console.log('Output:', data.toString().trim());
});

child.on('close', (code) => {
  console.log(`\nProcess finished with code: ${code}`);
  console.log('Full output:', output);
  
  if (code === 0) {
    console.log('✅ Script executed successfully!');
  } else {
    console.log('❌ Script failed with non-zero exit code');
  }
});

child.on('error', (error) => {
  console.error('❌ Failed to start process:', error);
});

// Timeout after 15 minutes (longer for real Instagram URLs)
setTimeout(() => {
  console.log('⏰ Test timeout reached, killing process...');
  child.kill();
}, 900000);