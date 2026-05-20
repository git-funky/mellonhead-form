/**
 * setup-notion.js
 * One-time script to configure the Notion Leads database properties
 * to match the new ATD landing page form schema.
 *
 * Usage:
 *   1. Fill in NOTION_TOKEN and NOTION_DATABASE_ID in .env (project root)
 *   2. node setup-notion.js
 *
 * Note: This script PATCHes the existing database. Notion does not allow
 * deleting properties via API, so old columns (Phone, Company Name, Company
 * Size) will remain but can be hidden/archived manually in Notion.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && value && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!TOKEN || !DATABASE_ID) {
  console.error('Error: NOTION_TOKEN and NOTION_DATABASE_ID must be set.');
  process.exit(1);
}

const properties = {
  Name: { title: {} },
  Email: { email: {} },
  Organization: { rich_text: {} },
  'Role / Title': { rich_text: {} },
  'Budget Range': {
    select: {
      options: [
        { name: 'Under $25k', color: 'red' },
        { name: '$25-50k', color: 'yellow' },
        { name: '$50-100k', color: 'green' },
        { name: '$100k+', color: 'blue' },
      ],
    },
  },
  'Primary Goals': {
    multi_select: {
      options: [
        { name: 'Get leadership conversant in AI', color: 'blue' },
        { name: 'Help managers lead AI adoption in their teams', color: 'green' },
        { name: 'Build a baseline of AI fluency across the organization', color: 'yellow' },
        { name: 'Develop internal builders or power users', color: 'orange' },
        { name: 'Redesign specific workflows with AI', color: 'pink' },
        { name: 'Figure out where to start', color: 'purple' },
        { name: 'Something else', color: 'gray' },
      ],
    },
  },
  'AI Tools in Use': {
    multi_select: {
      options: [
        { name: 'Microsoft 365 Copilot', color: 'blue' },
        { name: 'Google Gemini or Workspace AI', color: 'green' },
        { name: 'ChatGPT (Team or Enterprise)', color: 'yellow' },
        { name: 'Claude', color: 'orange' },
        { name: 'Other', color: 'gray' },
        { name: 'Not yet deployed or evaluating', color: 'red' },
      ],
    },
  },
  Timeline: {
    select: {
      options: [
        { name: 'Now or next quarter', color: 'green' },
        { name: '3-6 months', color: 'yellow' },
        { name: '6-12 months', color: 'orange' },
        { name: 'Later or exploring', color: 'gray' },
        { name: 'Unclear', color: 'red' },
      ],
    },
  },
  Source: { rich_text: {} },
  'Form Path': {
    select: {
      options: [
        { name: 'booking-request', color: 'blue' },
        { name: 'catalog-request', color: 'green' },
      ],
    },
  },
  Status: {
    select: {
      options: [
        { name: 'New', color: 'blue' },
        { name: 'Contacted', color: 'yellow' },
        { name: 'Qualified', color: 'green' },
        { name: 'Disqualified', color: 'red' },
      ],
    },
  },
  Bucket: { rich_text: {} },
  Opportunity: { rich_text: {} },
  'Specific Question or Context': { rich_text: {} },
  'Submitted At': { date: {} },
};

function notionRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'api.notion.com',
      path: urlPath,
      method,
      headers: {
        Authorization: 'Bearer ' + TOKEN,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function setup() {
  console.log('Fetching current database schema (' + DATABASE_ID + ')...');
  const get = await notionRequest('GET', '/v1/databases/' + DATABASE_ID, {});
  if (get.status !== 200) {
    console.error('Failed to fetch database:', JSON.stringify(get.body, null, 2));
    process.exit(1);
  }
  const existing = Object.keys(get.body.properties);
  console.log('Existing properties:', existing.join(', '));

  console.log('\nPatching database with new schema...');
  const patch = await notionRequest('PATCH', '/v1/databases/' + DATABASE_ID, { properties });
  if (patch.status === 200) {
    console.log('\nDatabase updated. Current properties:');
    Object.entries(patch.body.properties).forEach(([name, prop]) => {
      console.log('  - ' + name + ' (' + prop.type + ')');
    });
    console.log('\nNote: old columns (Phone, Company Name, Company Size) can be hidden in Notion manually.');
  } else {
    console.error('\nFailed to update database:', JSON.stringify(patch.body, null, 2));
    process.exit(1);
  }
}

setup().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
