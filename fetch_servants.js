// fetch_servants.js
// Run this script to fetch the latest FGO servant data and save it locally for your React app

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_URL = 'https://api.atlasacademy.io/export/NA/nice_servant.json';
const OUTPUT_PATH = path.join(__dirname, 'public', 'servants.json');
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1} of ${retries}...`);
      const response = await axios.get(url, {
        timeout: 30000 // 30 second timeout
      });
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`Attempt ${i + 1} failed. Retrying in ${RETRY_DELAY/1000} seconds...`);
      await wait(RETRY_DELAY);
    }
  }
}

async function fetchAndSaveServants() {
  try {
    console.log('Fetching NA servant data from Atlas Academy...');
    const response = await fetchWithRetry(API_URL);
    const servants = response.data;

    console.log(`Processing ${servants.length} servants...`);
    
    const filtered = servants
      .filter(servant => 
        // Filter out unwanted entries
        servant.type === 'normal' &&
        servant.collectionNo > 0 &&
        !servant.id.toString().startsWith('99') &&
        servant.bondGrowth && // Ensure bond data exists
        (servant.cost > 0 || servant.className.toLowerCase() === 'shielder')
      )
      .map(servant => ({
        id: servant.id,
        collectionNo: servant.collectionNo,
        name: servant.name,
        className: servant.className,
        rarity: servant.rarity,
        cost: servant.cost,
        bondGrowth: servant.bondGrowth
      }))
      // Sort by collection number for consistency
      .sort((a, b) => a.collectionNo - b.collectionNo);

    console.log(`Writing ${filtered.length} processed servants to ${OUTPUT_PATH}...`);

    // Write to file with pretty formatting
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
    console.log(`NA Servant data saved to ${OUTPUT_PATH} (${filtered.length} servants)`);
  } catch (err) {
    console.error('Failed to fetch or save servant data:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    process.exit(1);
  }
}

fetchAndSaveServants();
