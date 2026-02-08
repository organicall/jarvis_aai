# JARVIS Complete Guide (A-Z)

This guide is the full end-to-end manual for running and using JARVIS locally.

## A. What JARVIS Does

JARVIS helps financial advisors:
- Parse client documents
- Track client and portfolio context
- Generate AI-assisted meeting briefs
- Review investments, protection, and compliance workflows

## B. System Requirements

Install:
- Node.js 18+
- npm
- Git

Create accounts/API access:
- Groq API key
- Supabase project URL + anon key

## C. Get the Code

```bash
git clone https://github.com/yourusername/jarvis-advisor-ai.git
cd jarvis-advisor-ai
```

## D. Install Dependencies

```bash
npm install
```

## E. Configure Environment Variables

1. Copy the example:

```bash
cp .env.example .env
```

2. Fill `.env` values:

```env
# Groq API Key
GROQ_API_KEY=your_groq_api_key_here
VITE_GROQ_API_KEY=your_groq_api_key_here

# Server Configuration
PORT=8787
VITE_API_BASE=http://localhost:8787

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## F. Start the Project

Recommended (frontend + backend together):

```bash
npm run dev:all
```

Or run separately:

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

Default local URLs:
- Frontend: http://localhost:5173
- Backend: http://localhost:8787

## G. Verify Everything Is Running

1. Open the frontend URL.
2. Confirm dashboard loads without API key errors.
3. Check browser console for no critical startup errors.
4. Confirm backend terminal has no crashes.

## H. First-Time Usage Flow

1. Open **Clients** tab.
2. Add a client (manual or document flow).
3. Confirm client appears in list.
4. Open **Meeting Prep** for that client.
5. Generate a brief.
6. Review **Investments**, **Protection**, and **Compliance** tabs.

<a id="using-the-application-a-z"></a>
## I. Using the Application (A-Z)

## Global Navigation and Top Bar

- `Dashboard`, `Clients`, `Meeting Prep`, `Investments`, `Protection`, `Compliance`, `Settings`: switches tabs.
- Global search (`Search client, note, task...`): searches clients by name, shows top matches, and opens selected client in **Clients**.
- Keyboard shortcut: `Cmd/Ctrl + K` focuses the global search input.
- `New Note`: opens a new Google Doc in a new browser tab.

## Dashboard

- KPI cards (`Total AUM`, `Total Clients`, `Critical Actions`, `Upcoming Reviews`): read-only performance snapshot.
- Priority Actions row `Arrow` button: opens that client in **Clients** tab.
- `Add New Client`: opens **Clients** tab and launches Add Client modal.
- `Generate Reports`: currently visual-only (no click action wired yet).
- Upcoming Reviews `+` button: opens schedule modal for a new meeting.
- Upcoming Reviews `Edit` (pencil) button: opens schedule modal for that specific client.
- Upcoming Reviews `Prep Report`: jumps to **Meeting Prep** with that client pre-selected.
- Schedule modal `Cancel`: closes modal without saving.
- Schedule modal `Save Meeting`: saves `next_review_date` and `next_review_note` for selected client.

## Clients

- `Search clients by name or ID...`: filters visible client list.
- `Filter`: opens filter menu.
- Filter options (`All/Active/Inactive`, `Show All/Critical Action Only`): narrows list.
- `Clear All Filters`: resets filters to default.
- `Add Client`: opens Add New Client modal.
- Add Client modal `Upload DOCX`: uploads a `.docx` for AI parsing.
- Add Client modal `Insert Parsed Data`: copies parsed output into form fields.
- Add Client modal `Save Client`: creates client + associated section records.
- Add Client modal `Cancel` or `X`: closes modal and discards unsaved edits.
- Client row click: expands/collapses full client details.
- Expanded row `Edit Client`: enables inline edit mode.
- Expanded row edit mode `Save`: saves changes.
- Expanded row edit mode `Cancel`: exits edit mode without saving.

## Meeting Prep

- `Client` dropdown: selects client context.
- `Meeting Type` dropdown: sets prompt context for generated brief.
- `Generate Brief`: creates AI brief (falls back to offline brief on AI failure).
- After brief generation, `Change Client`: clears current brief and returns to selector mode.
- After brief generation, `Regenerate`: re-runs brief generation for selected client/type.
- Finance Chatbot quick prompt chips: sends predefined advisor prompts.
- Finance Chatbot text box + send button: sends custom question in selected client context.
- Email actions `Copy Email` and `Send Draft`: currently visual-only (no action wired yet).

## Investments

- KPIs and charts are read-only analytics.
- `View by Client`: currently visual-only (no action wired yet).

## Protection

- `Generate Quote` in Unprotected Risks: currently visual-only (no action wired yet).
- Policy maturity table is read-only and highlights near-term expiries.

## Compliance

- Search box: currently visual-only (not wired to filtering yet).
- `New Suitability Report`: currently visual-only (no action wired yet).
- `Download Evidence Pack`: currently visual-only (no action wired yet).
- `View Gap Analysis`: currently visual-only (no action wired yet).

## Settings / Config

- Current page is informational.
- It indicates API key configuration is handled in Meeting Prep logic and that workflow/automation settings are planned.

## J. Word Document Parsing Workflow

1. Upload a client Word document where expected.
2. System parses and extracts structured data.
3. Verify extracted fields before relying on output.
4. Edit/adjust client details if needed.

## K. Troubleshooting

## Frontend does not start

- Re-run `npm install`
- Check Node version (`node -v`, should be 18+)
- Confirm no port conflict on `5173`

## Backend does not start

- Confirm `GROQ_API_KEY` exists in `.env`
- Confirm no port conflict on `8787`
- Start with `npm run server` and inspect terminal errors

## AI outputs are missing or weak

- Verify `GROQ_API_KEY` is valid
- Check backend logs for API failures
- Confirm client data exists before generating brief

## Supabase data not loading

- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Confirm project is active and credentials are correct

## L. Security Best Practices

- Never commit `.env`
- Rotate exposed API keys immediately
- Use production-safe Supabase policies before real usage
- Separate dev and production environment values

## M. Deployment Overview

## Frontend

Deploy to Vercel/Netlify:
- Build: `npm run build`
- Output: `dist`
- Add required frontend env vars in host dashboard

## Backend

Deploy server (`/server`) to Railway/Render (or equivalent):
- Set `GROQ_API_KEY` in backend host env
- Update frontend `VITE_API_BASE` to backend URL

## N. Suggested Daily Workflow for Advisors

1. Start on Dashboard for priority scan.
2. Open Clients and update latest context.
3. Generate Meeting Prep brief before each client call.
4. Validate recommendations in Investments/Protection.
5. Confirm documentation in Compliance.
6. Capture final actions and follow-ups.

## O. Known Limitations

Current project scope is a proof-of-concept. For production usage, add:
- Stronger validation and error handling
- Authentication and authorization
- Full audit logs
- Regulatory controls and operational safeguards

## P. Quick Command Reference

```bash
npm install
npm run dev
npm run server
npm run dev:all
npm run build
```

## Q. Where to Start if You Are New

1. Complete sections C-F.
2. Follow section H once running.
3. Use section I as your operational reference.
4. Use section K for errors.
