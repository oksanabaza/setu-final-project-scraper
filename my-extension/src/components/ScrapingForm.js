import React, { useState } from 'react';

const ScrapingForm = ({ token }) => {
  const [url, setUrl] = useState('');
  const [responseData, setResponseData] = useState(null);

  const handleScrape = async () => {
    try {
      const response = await fetch('https://setu-final-project.onrender.com/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      setResponseData(data);
    } catch (error) {
      console.error('Scraping error:', error);
    }
  };

  return (
    <div>
      <h4>Scrape Website</h4>
      <input
        type="text"
        placeholder="Enter website URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button onClick={handleScrape}>Scrape</button>
      {responseData && <pre>{JSON.stringify(responseData, null, 2)}</pre>}
    </div>
  );
};

export default ScrapingForm;