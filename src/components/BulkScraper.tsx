// components/BulkScraper.tsx oder wo dein Scraper ist

async function scrapeVintedProfiles(urls: string[]) {
  try {
    const response = await fetch('/api/scrape-vinted', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Scraping failed:', error);
    throw error;
  }
}

// Beispiel-Nutzung:
const results = await scrapeVintedProfiles([
  'https://www.vinted.de/member/3138250645-scndunit',
  'https://www.vinted.de/member/123456789-username'
]);
