# Mellonhead Form — Project Instructions

## Styling Guidelines

### Colors

| Token       | Hex       | Usage                                  |
|-------------|-----------|----------------------------------------|
| Primary     | `#f46665` | Page background                        |
| Dark        | `#1e3a5f` | Card background, dark text             |
| Light       | `#fdf5e6` | Card text, input background            |
| Accent      | `#ffc512` | Buttons, focus rings, success messages |

### Typography

- **Headers**: Nunito (Google Fonts) — weights 400, 600, 700
- **Body**: PT Sans (Google Fonts) — weights 400, 700

### General Rules

- Page background always uses Primary (`#f46665`)
- Form card uses Dark (`#1e3a5f`) background with Light (`#fdf5e6`) text
- Input fields use Light background with Dark text
- Interactive elements (buttons, focus states) use Accent (`#ffc512`)
- Button text uses Dark (`#1e3a5f`) for contrast against the Accent background
- Error states use soft red (`#f87171` / `#fca5a5`) that reads well on the dark card

---

## Architecture

- **Form**: `index.html` — hosted on GitHub Pages at `https://git-funky.github.io/mellonhead-form`
- **Backend**: Google Cloud Function (`cloud-function/`) — deployed to project `co-mellonhead`, region `us-central1`
- **Function URL**: `https://us-central1-co-mellonhead.cloudfunctions.net/contactForm`
- **Data storage**: Notion database ID `3636d2189ed6808b8c01e3b9ad5615d2` in the mellonhead workspace

## Form Fields

| Field        | Required | Type     | Notes                              |
|--------------|----------|----------|------------------------------------|
| Name         | Yes      | Text     | Max 100 chars                      |
| Email        | Yes      | Email    | Valid email format                 |
| Phone        | No       | Tel      | US format only                     |
| Company Name | No       | Text     | Max 200 chars                      |
| Company Size | No       | Dropdown | See options below                  |
| Message      | No       | Textarea | Max 2000 chars                     |

### Company Size Options
- Just me / Freelancer
- Less than 100
- 100 – 1000
- Greater than 1000
