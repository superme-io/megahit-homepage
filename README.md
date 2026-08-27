# megahit-homepage

Static marketing site for megahit.ai. No build step and no dependencies — the
HTML, CSS and JS are served as authored, and `api/` holds Vercel serverless
functions written against global `fetch`. Keep it that way; adding a bundler
means every edit here needs a build to see.

`vercel.json` sets `cleanUrls`, so `about.html` is served at `/about`.

## Waitlist

`api/waitlist.js` persists the lead into the shared Supabase
`waitlist_submissions` table (`from_source = 'megahit'`), then sends the welcome
email carrying the Growth Playbook through Resend's HTTP API. The send is
best-effort: the lead is already stored by the time it runs, so a mail failure
is logged and the visitor still sees a success.

Environment variables (Vercel project settings):

| variable | required | notes |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | yes | lead storage |
| `RESEND_API_KEY` | yes | no key = no email, lead still saved |
| `WELCOME_EMAIL_FROM` | yes | e.g. `Megahit <hello@send.megahit.ai>` |
| `GROWTH_PLAYBOOK_URL` | no | defaults to `https://megahit.ai/playbook` |
| `MEGAHIT_APP_URL` | no | defaults to `https://megahit.ai` |
| `WELCOME_EMAIL_REPLY_TO` | no | |
| `WELCOME_EMAIL_UNSUBSCRIBE` | no | sets the `List-Unsubscribe` header |

The sending domain must be verified in Resend. Use a dedicated subdomain such as
`send.megahit.ai` — `mail.megahit.ai` is already the product backend's SES
MAIL FROM domain and must not be reused.

## Playbook

`playbook.html` (served at `/playbook`) is the lead magnet the welcome email
links to. It is `noindex` and disallowed in `robots.txt`: it is traded for an
email address, so it should not be reachable from search. It is deliberately
absent from `sitemap.xml` for the same reason.

Its "Download PDF" button serves the pre-rendered
`assets/Growth-Playbook-101.pdf` (49 pages). The PDF is committed rather than
generated per request — Vercel functions would need a headless Chromium to do
it live, which is exactly the build-time dependency this repo avoids.

**Regenerate the PDF after editing `playbook.html`,** or the download silently
serves the old document:

```bash
mkdir -p /tmp/pdfgen && cd /tmp/pdfgen && npm init -y && npm i puppeteer
node --input-type=module -e '
import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless: "new" });
const p = await b.newPage();
await p.goto("file://'"$PWD"'/playbook.html", { waitUntil: "networkidle0" });
await p.evaluateHandle("document.fonts.ready");
await p.emulateMediaType("print");   // hides the download button, un-stickies the header
await p.pdf({ path: "assets/Growth-Playbook-101.pdf", format: "A4", printBackground: true,
  margin: { top: "12mm", bottom: "14mm", left: "0mm", right: "0mm" } });
await b.close();'
```
