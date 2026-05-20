# Mellonhead Form — Project Instructions

## Styling Guidelines

### Colors

| Token       | Hex       | Usage                                  |
|-------------|-----------|----------------------------------------|
| Primary     | `#f46665` | Buttons                                |
| Dark        | `#1e3a5f` | Card background, dark text             |
| Light       | `#fdf5e6` | Page background, card text, input background |
| Accent      | `#ffc512` | Focus rings, success messages          |

### Typography

- **Headers**: Nunito (Google Fonts) — weights 400, 600, 700
- **Body**: PT Sans (Google Fonts) — weights 400, 700

### General Rules

- Page background uses Light (`#fdf5e6`)
- Form card uses Dark (`#1e3a5f`) background with Light (`#fdf5e6`) text
- Input fields use Light background with Dark text
- Buttons use Primary (`#f46665`) with Light (`#fdf5e6`) text
- Focus rings use Accent (`#ffc512`)
- Error states use soft red (`#f87171` / `#fca5a5`) that reads well on the dark card

---

## Architecture

- **Form**: `index.html` — hosted on GitHub Pages, served at `https://learn.mellonhead.co` (custom domain; GitHub Pages origin: `https://git-funky.github.io/mellonhead-form`)
- **Backend**: Google Cloud Function (`cloud-function/`) — deployed to project `co-mellonhead`, region `us-central1`
- **Function URL**: `https://us-central1-co-mellonhead.cloudfunctions.net/contactForm`
- **Data storage**: Notion test Leads DB ID `3636d2189ed6808b8c01e3b9ad5615d2` (swap for production DB ID before launch)

## Form Fields

| Field                              | Required | Type         | Notes                                      |
|------------------------------------|----------|--------------|--------------------------------------------|
| Full name                          | Yes      | Text         | Max 100 chars                              |
| Work email                         | Yes      | Email        | Valid email format                         |
| Organization                       | Yes      | Text         | Max 200 chars                              |
| Role / title                       | Yes      | Text         | Max 100 chars                              |
| Budget range                       | Yes      | Dropdown     | Under $25k / $25–50k / $50–100k / $100k+  |
| What are you trying to do?         | No       | Multi-select | 7 options (see brief §7)                   |
| What AI tools are in use today?    | No       | Multi-select | 6 options (see brief §7)                   |
| When are you looking to start?     | No       | Dropdown     | 5 options (see brief §7)                   |
| Anything specific you're working through? | No | Textarea  | Max 2000 chars                             |
| source (hidden)                    | —        | Hidden       | Always "ATD 2026"                          |
| formPath (hidden)                  | —        | Hidden       | "booking-request" or "catalog-request"     |
