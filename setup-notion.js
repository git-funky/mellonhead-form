/**
 * setup-notion.js
 * One-time script to configure the Notion database properties
 * to match the contact form fields.
 *
 * Usage:
 *   NOTION_TOKEN=your_token node setup-notion.js
 *
 * Or edit the TOKEN and DATABASE_ID constants below and run:
 *   node setup-notion.js
 */

const https = require('https');

const TOKEN = process.env.NOTION_TOKEN || 'YOUR_NOTION_TOKEN';
const DATABASE_ID = process.env.NOTION_DATABASE_ID || '3636d2189ed6808b8c01e3b9ad5615d2';

const properties = {
  // "Name" is the default title property — Notion always has one.
  // We rename it to "Name" and leave it as title type.
  Name: { title: {} },

  Email: { email: {} },

  Phone: { phone_number: {} },

  'Company Name': { rich_text: {} },

  'Company Size': {
    select: {
      options: [
        { name: 'Just me / Freelancer', color: 'blue' },
        { name: 'Less than 100', color: 'green' },
        { name: '100 – 1000', color: 'yellow' },
        { name: 'Greater than 1000', color: 'orange' },
      ],
    },
  },

  Message: { rich_text: {} },

  'Submitted At': { date: {} },
};

function notionRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'api.notion.com',
      path,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function setup() {
  console.log('Fetching current database schema...');
  const get = await notionRequest('GET', `/v1/databases/${DATABASE_ID}`, {});

  if (get.status !== 200) {
    console.error('Failed to fetch database:', get.body);
    process.exit(1);
  }

  const existing = Object.keys(get.body.properties);
  console.log('Existing properties:', existing.join(', '));

  console.log('\nUpdating database properties...');
  const patch = await notionRequest('PATCH', `/v1/databases/${DATABASE_ID}`, { properties });

  if (patch.status === 200) {
    console.log('\nDone! Database properties configured:');
    Object.keys(patch.body.properties).forEach((p) => {
      console.log(`  ✓ ${p} (${patch.body.properties[p].type})`);
    });
  } else {
    console.error('\nFailed to update database:', JSON.stringify(patch.body, null, 2));
    process.exit(1);
  }
}

setup().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
