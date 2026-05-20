/**
 * Mellonhead Contact Form — Google Cloud Function
 *
 * Environment variables:
 *   NOTION_TOKEN        — Notion integration token
 *   NOTION_DATABASE_ID  — ID of the target Notion Leads database
 */

const { Client } = require('@notionhq/client');

const ALLOWED_ORIGINS = [
  'https://git-funky.github.io',  // GitHub Pages (keep for testing)
  'https://learn.mellonhead.co',  // Production custom domain
];

const VALID_BUDGETS = ['Under $25k', '$25-50k', '$50-100k', '$100k+'];

const VALID_TIMELINES = [
  'Now or next quarter',
  '3-6 months',
  '6-12 months',
  'Later or exploring',
  'Unclear',
];

const VALID_GOALS = [
  'Get leadership conversant in AI',
  'Help managers lead AI adoption in their teams',
  'Build a baseline of AI fluency across the organization',
  'Develop internal builders or power users',
  'Redesign specific workflows with AI',
  'Figure out where to start',
  'Something else',
];

const VALID_TOOLS = [
  'Microsoft 365 Copilot',
  'Google Gemini or Workspace AI',
  'ChatGPT (Team or Enterprise)',
  'Claude',
  'Other',
  'Not yet deployed or evaluating',
];

const VALID_FORM_PATHS = ['booking-request', 'catalog-request'];

// Initialise Notion client once (reused across warm invocations)
let notionClient;
function getNotion() {
  if (!notionClient) {
    notionClient = new Client({ auth: process.env.NOTION_TOKEN });
  }
  return notionClient;
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Max-Age', '3600');
}

/**
 * Validate incoming form data.
 * Returns an object of field -> error message, or empty object if valid.
 */
function validate(body) {
  const errors = {};
  const { name, email, organization, role, budget, goals, tools, timeline } = body;

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

  if (!organization || organization.trim().length === 0) {
    errors.organization = 'Organization is required.';
  } else if (organization.trim().length > 200) {
    errors.organization = 'Organization must be 200 characters or less.';
  }

  if (!role || role.trim().length === 0) {
    errors.role = 'Role / title is required.';
  } else if (role.trim().length > 100) {
    errors.role = 'Role must be 100 characters or less.';
  }

  if (!budget || !VALID_BUDGETS.includes(budget)) {
    errors.budget = 'Please select a valid budget range.';
  }

  if (timeline && !VALID_TIMELINES.includes(timeline)) {
    errors.timeline = 'Invalid timeline value.';
  }

  if (goals && Array.isArray(goals)) {
    const invalid = goals.filter(g => !VALID_GOALS.includes(g));
    if (invalid.length > 0) {
      errors.goals = 'Invalid goal value(s).';
    }
  }

  if (tools && Array.isArray(tools)) {
    const invalid = tools.filter(t => !VALID_TOOLS.includes(t));
    if (invalid.length > 0) {
      errors.tools = 'Invalid tool value(s).';
    }
  }

  return errors;
}

/**
 * Build the Notion page properties object from the validated form data.
 */
function buildNotionProperties(body) {
  const { name, email, organization, role, budget, goals, tools, timeline, context, formPath } = body;

  const properties = {
    Name: {
      title: [{ text: { content: name.trim() } }],
    },
    Email: {
      email: email.trim(),
    },
    Organization: {
      rich_text: [{ text: { content: organization.trim() } }],
    },
    'Role / Title': {
      rich_text: [{ text: { content: role.trim() } }],
    },
    'Budget Range': {
      select: { name: budget },
    },
    Source: {
      rich_text: [{ text: { content: 'ATD 2026' } }],
    },
    Status: {
      select: { name: 'New' },
    },
    'Submitted At': {
      date: { start: new Date().toISOString() },
    },
  };

  // Form path (booking-request or catalog-request)
  if (formPath && VALID_FORM_PATHS.includes(formPath)) {
    properties['Form Path'] = { select: { name: formPath } };
  }

  // Multi-select: Primary Goals
  if (goals && Array.isArray(goals) && goals.length > 0) {
    properties['Primary Goals'] = {
      multi_select: goals.map(g => ({ name: g })),
    };
  }

  // Multi-select: AI Tools in Use
  if (tools && Array.isArray(tools) && tools.length > 0) {
    properties['AI Tools in Use'] = {
      multi_select: tools.map(t => ({ name: t })),
    };
  }

  // Optional select: Timeline
  if (timeline && VALID_TIMELINES.includes(timeline)) {
    properties['Timeline'] = { select: { name: timeline } };
  }

  // Optional textarea: Specific Question or Context (2000-char Notion limit)
  if (context && context.trim()) {
    properties['Specific Question or Context'] = {
      rich_text: [{ text: { content: context.trim().substring(0, 2000) } }],
    };
  }

  return properties;
}

/**
 * Main Cloud Function entry point.
 */
exports.contactForm = async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed.' });
    return;
  }

  const body = req.body || {};

  // Honeypot check
  if (body._honeypot) {
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
