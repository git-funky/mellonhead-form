/**
 * Mellonhead Contact Form — Google Cloud Function
 *
 * Environment variables (set in GCP Console or via --set-env-vars at deploy time):
 *   NOTION_TOKEN        — Notion personal access token
 *   NOTION_DATABASE_ID  — ID of the target Notion database
 */

const { Client } = require('@notionhq/client');

const ALLOWED_ORIGIN = 'https://git-funky.github.io';

const VALID_COMPANY_SIZES = [
  'Just me / Freelancer',
  'Less than 100',
  '100 – 1000',
  'Greater than 1000',
];

// Initialise Notion client once (reused across warm invocations)
let notionClient;
function getNotion() {
  if (!notionClient) {
    notionClient = new Client({ auth: process.env.NOTION_TOKEN });
  }
  return notionClient;
}

/**
 * Set CORS headers. Only the GitHub Pages origin is allowed.
 */
function setCorsHeaders(req, res) {
  const origin = req.headers.origin || '';
  if (origin === ALLOWED_ORIGIN) {
    res.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Max-Age', '3600');
}

/**
 * Validate incoming form data.
 * Returns an object of field -> error message, or an empty object if valid.
 */
function validate(body) {
  const errors = {};
  const { name, email, phone, companyName, companySize } = body;

  if (!name || name.trim().length === 0) {
    errors.name = 'Name is required.';
  } else if (name.trim().length > 100) {
    errors.name = 'Name must be 100 characters or less.';
  }

  if (!email || email.trim().length === 0) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Invalid email address.';
  }

  if (phone && phone.trim().length > 0) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) {
      errors.phone = 'Invalid US phone number.';
    }
  }

  if (companyName && companyName.trim().length > 200) {
    errors.companyName = 'Company name must be 200 characters or less.';
  }

  if (companySize && !VALID_COMPANY_SIZES.includes(companySize)) {
    errors.companySize = 'Invalid company size value.';
  }

  return errors;
}

/**
 * Build the Notion page properties object from the validated form data.
 */
function buildNotionProperties(body) {
  const { name, email, phone, companyName, companySize, message } = body;

  const properties = {
    Name: {
      title: [{ text: { content: name.trim() } }],
    },
    Email: {
      email: email.trim(),
    },
    'Submitted At': {
      date: { start: new Date().toISOString() },
    },
  };

  if (phone && phone.trim()) {
    properties.Phone = { phone_number: phone.trim() };
  }

  if (companyName && companyName.trim()) {
    properties['Company Name'] = {
      rich_text: [{ text: { content: companyName.trim() } }],
    };
  }

  if (companySize) {
    properties['Company Size'] = {
      select: { name: companySize },
    };
  }

  if (message && message.trim()) {
    // Notion rich_text has a 2000-character limit per block
    properties.Message = {
      rich_text: [{ text: { content: message.trim().substring(0, 2000) } }],
    };
  }

  return properties;
}

/**
 * Main Cloud Function entry point.
 */
exports.contactForm = async (req, res) => {
  setCorsHeaders(req, res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed.' });
    return;
  }

  const body = req.body || {};

  // Honeypot check — bots fill hidden fields, humans don't
  if (body._honeypot) {
    // Return 200 so bots think they succeeded
    res.status(200).json({ success: true });
    return;
  }

  // Server-side validation
  const errors = validate(body);
  if (Object.keys(errors).length > 0) {
    res.status(400).json({ success: false, errors });
    return;
  }

  // Write to Notion
  try {
    const notion = getNotion();
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: buildNotionProperties(body),
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Notion API error:', err?.body ?? err);
    res.status(500).json({ success: false, error: 'Failed to save submission. Please try again.' });
  }
};
