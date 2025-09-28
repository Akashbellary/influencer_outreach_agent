#!/usr/bin/env node
// Test script for Instagram username extraction using Meta oEmbed API
let fetch;
try {
  fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
} catch (e) {
  console.error('node-fetch import failed:', e);
}
const fs = require('fs');
const path = require('path');

// Load config.json for access token and permalinks
defaultConfigPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
const accessToken = config.instagram_access_token || config.user_access_token || config.long_access_token;

// Permalinks to test (replace with your actual list)
const permalinks = [
  "https://www.instagram.com/p/DLZTLrChaF7/",
  "https://www.instagram.com/p/DN9mNdHj_wS/",
  "https://www.instagram.com/p/DOeazpvkpLE/"
];

const oembedEndpoint = 'https://graph.facebook.com/v21.0/instagram_oembed';

async function getUsernameFromOEmbed(permalink) {
  const params = new URLSearchParams({
    url: permalink,
    fields: 'author_name,thumbnail_url',
    access_token: accessToken
  });
  const url = `${oembedEndpoint}?${params.toString()}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.author_name) {
      return { url: permalink, username: data.author_name, thumbnail: data.thumbnail_url };
    } else {
      return { url: permalink, error: data.error || 'No author_name found' };
    }
  } catch (err) {
    return { url: permalink, error: err.message };
  }
}

(async () => {
  console.log('Testing Instagram oEmbed API for username extraction...');
  for (const permalink of permalinks) {
    const result = await getUsernameFromOEmbed(permalink);
    console.log(result);
  }
})();
