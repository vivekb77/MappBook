import fetch from 'node-fetch';

// Sample orders with postal codes from different countries
const orders = [
  { ship_postal_code: "T6C 0Y7", ship_country: "CA" },  // Canada
  { ship_postal_code: "SW1A 1AA", ship_country: "GB" }, // UK
  { ship_postal_code: "10001", ship_country: "US" },    // USA
  { ship_postal_code: "2000", ship_country: "AU" },     // Australia
  { ship_postal_code: "100-0001", ship_country: "JP" }, // Japan
  { ship_postal_code: "10115", ship_country: "DE" },    // Germany
  { ship_postal_code: "75001", ship_country: "FR" },    // France
  { ship_postal_code: "00100", ship_country: "IT" },    // Italy
  { ship_postal_code: "1000", ship_country: "NL" },     // Netherlands
  { ship_postal_code: "169-036", ship_country: "SG" }   // Singapore
];

async function validatePostalCode(order) {
  try {
    const API_KEY = '';
    if (!API_KEY) {
      throw new Error('API key not found in environment variables');
    }

    const response = await fetch(
      `http://api.positionstack.com/v1/forward?access_key=${API_KEY}&query=${encodeURIComponent(order.ship_postal_code)}&country=${order.ship_country}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data && data.data[0] && data.data[0].confidence === 1) {
      console.log(`✅ Success for ${order.ship_country} - ${order.ship_postal_code}`);
      console.log(`   Location: ${data.data[0].label}`);
    } else {
      console.log(`❌ Failed validation for ${order.ship_country} - ${order.ship_postal_code}`);
    }
  } catch (error) {
    console.error(`Error processing ${order.ship_country} - ${order.ship_postal_code}:`, error.message);
  }
}

async function processAllOrders() {
  console.log('Starting postal code validation...\n');
  
  // Process orders sequentially to avoid rate limiting
  for (const order of orders) {
    await validatePostalCode(order);
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\nValidation complete!');
}

processAllOrders().catch(console.error);

// node testpostcodes.js;  