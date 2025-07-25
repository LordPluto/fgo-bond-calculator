/**
 * fetch_servants_jp.js
 * Fetches and processes JP servant data from Atlas Academy API
 * 
 * @author AJDxB <ajdxb4787@gmail.com>
 * @version 0.3.4 - Enhanced error handling and CI/CD integration
 * @created 2025-06-04
 * @github https://github.com/AJDxB/fgo-bond-calculator
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const JP_API_URL = 'https://api.atlasacademy.io/export/JP/nice_servant_lang_en.json';
const OUTPUT_FILE = path.join('public', 'servants_jp.json');
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

async function fetchServants() {
    try {
        console.log('Fetching JP servant data from Atlas Academy...');
        const response = await fetchWithRetry(JP_API_URL);
        const servants = response.data;

        console.log(`Processing ${servants.length} servants...`);
        
        // Process and filter servants
        const processedServants = servants
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
                bondGrowth: servant.bondGrowth,
                traits: servant.traits.map(trait => trait.name)
            }))
            .sort((a, b) => a.collectionNo - b.collectionNo);

        console.log(`Writing ${processedServants.length} processed servants to ${OUTPUT_FILE}...`);
        
        // Write to file with pretty formatting
        await fs.writeFile(
            OUTPUT_FILE,
            JSON.stringify(processedServants, null, 2),
            'utf8'
        );

        console.log('JP Servant data successfully updated!');
    } catch (error) {
        console.error('Error fetching or processing JP servant data:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

// Execute the fetch
fetchServants();
