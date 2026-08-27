// Waitlist submission endpoint.
// Mirrors the memery-homepage implementation: persists leads into the shared
// Supabase `waitlist_submissions` table, tagged with from_source = 'megahit'.
// Uses the Supabase REST API via global fetch so the static site needs no
// dependencies and no build step.
//
// After the lead is persisted, a welcome email carrying the Growth Playbook is
// sent through Resend's HTTP API — same reason as above, no SDK and no build
// step. The send is best-effort: the lead is already saved by then, so a mail
// failure must never turn a successful signup into an error the visitor sees.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 10000;
const DEFAULT_APP_URL = 'https://megahit.ai';
// Ships with this site (playbook.html, served as /playbook by cleanUrls), so it
// needs no configuration; the env var is an override, not a prerequisite.
const DEFAULT_PLAYBOOK_URL = 'https://megahit.ai/playbook';
const SUBJECT = 'Here it is: Growth Playbook 101';

/** First word of the submitted name, for the greeting. */
function firstNameOf(name) {
  const first = String(name || '').trim().split(/\s+/)[0];
  return first || 'there';
}

/** The name is visitor-supplied and lands inside an HTML document. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function welcomeEmail({ firstName, playbookUrl, appUrl }) {
  const text = `Hi ${firstName},

Here it is: Growth Playbook 101 -> ${playbookUrl}

Bookmark it. It's the same playbook we run inside Megahit every day.

Here's the part the playbook can't do for you: your growth stack has amnesia. Nine tools, none of them talking. Every campaign starts from zero. Every lesson dies in a Notion doc.

Megahit fixes that. Nine AI growth agents - research, content, outbound, SEO, PR, KOL, launches, dev community - that plan six months out and actually execute. What outbound learns, SEO inherits. What your launch learns, PR inherits. Growth compounds instead of resetting.

One founder, one system, no agency retainer.

See what it builds for your company -> ${appUrl}

And if you know a founder still doing growth alone at 2am - forward this to them. That's how most people find us.

Your Growth Co-Founder,
Megahit`;

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(SUBJECT)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f6f8">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;padding:36px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1d23;font-size:15px;line-height:1.65">
            <tr>
              <td>
                <p style="margin:0 0 20px">Hi ${escapeHtml(firstName)},</p>

                <p style="margin:0 0 16px">Here it is:</p>

                <p style="margin:0 0 22px">
                  <a href="${playbookUrl}" style="display:inline-block;background:#264ef7;color:#ffffff;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:10px">Growth Playbook 101 &rarr;</a>
                </p>

                <p style="margin:0 0 20px">Bookmark it. It&rsquo;s the same playbook we run inside Megahit every day.</p>

                <p style="margin:0 0 20px">
                  Here&rsquo;s the part the playbook can&rsquo;t do for you: your growth stack has amnesia.
                  Nine tools, none of them talking. Every campaign starts from zero. Every lesson dies in a Notion doc.
                </p>

                <p style="margin:0 0 20px">
                  Megahit fixes that. Nine AI growth agents &mdash; research, content, outbound, SEO, PR, KOL,
                  launches, dev community &mdash; that plan six months out and actually execute. What outbound
                  learns, SEO inherits. What your launch learns, PR inherits. Growth compounds instead of resetting.
                </p>

                <p style="margin:0 0 24px">One founder, one system, no agency retainer.</p>

                <p style="margin:0 0 24px">
                  <a href="${appUrl}" style="color:#264ef7;font-weight:600;text-decoration:none">See what it builds for your company &rarr;</a>
                </p>

                <p style="margin:0 0 28px">
                  And if you know a founder still doing growth alone at 2am &mdash; forward this to them.
                  That&rsquo;s how most people find us.
                </p>

                <p style="margin:0;color:#6b7280">
                  Your Growth Co-Founder,<br>
                  Megahit
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject: SUBJECT, text, html };
}

/**
 * Send the welcome email. Returns a short status string rather than throwing:
 * every caller is past the point where the lead is already stored.
 */
async function sendWelcomeEmail({ to, name }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.WELCOME_EMAIL_FROM;
  const playbookUrl = process.env.GROWTH_PLAYBOOK_URL || DEFAULT_PLAYBOOK_URL;
  const appUrl = process.env.MEGAHIT_APP_URL || DEFAULT_APP_URL;

  if (!apiKey || !from) return 'skipped: RESEND_API_KEY / WELCOME_EMAIL_FROM not configured';

  const { subject, text, html } = welcomeEmail({
    firstName: firstNameOf(name),
    playbookUrl,
    appUrl,
  });

  const payload = { from, to: [to], subject, text, html };

  const replyTo = process.env.WELCOME_EMAIL_REPLY_TO;
  if (replyTo) payload.reply_to = replyTo;

  // Recipients asked for this asset, so it is transactional — but it also
  // pitches, so give every client a one-click way out.
  const unsubscribe = process.env.WELCOME_EMAIL_UNSUBSCRIBE;
  if (unsubscribe) payload.headers = { 'List-Unsubscribe': `<${unsubscribe}>` };

  // A hung provider call would otherwise burn the function's whole execution
  // budget and fail a request whose lead is already saved.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  try {
    const resp = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const detail = await resp.text().catch(() => '');
      return `failed: ${resp.status} ${detail.slice(0, 200)}`;
    }
    return 'sent';
  } catch (error) {
    return `failed: ${error.name === 'AbortError' ? 'timed out' : error.message}`;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ success: false, message: 'Missing Supabase credentials' });
  }

  try {
    // Vercel parses JSON bodies automatically, but guard against string/empty.
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    const email = body.email;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // The megahit form collects name / email / industry, plus which gate
    // variant (A/B/C) triggered the modal. Map onto existing table columns and
    // stash the extra context in `notes`.
    const notesParts = [];
    if (body.industry) notesParts.push(`Industry: ${body.industry}`);
    if (body.gate) notesParts.push(`Gate: ${body.gate}`);

    const submission = {
      email: email,
      name: body.name || undefined,
      from_source: 'megahit',
      notes: notesParts.length ? notesParts.join('; ') : undefined,
      created_at: new Date().toISOString(),
    };

    Object.keys(submission).forEach((key) => {
      if (submission[key] === undefined) delete submission[key];
    });

    const resp = await fetch(`${supabaseUrl}/rest/v1/waitlist_submissions`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify([submission]),
    });

    const data = await resp.json().catch(() => null);

    if (!resp.ok) {
      const message = (data && (data.message || data.error || data.hint)) || 'Insert failed';
      throw new Error(message);
    }

    // The lead is stored. From here the response is a success no matter what
    // the mail provider does, so the outcome is logged and never thrown.
    const emailStatus = await sendWelcomeEmail({ to: email, name: body.name });
    if (emailStatus !== 'sent') {
      console.warn('Welcome email not sent:', emailStatus);
    }

    return res.json({
      success: true,
      message: 'Successfully added to waitlist',
      submissionId: Array.isArray(data) ? data[0]?.id : undefined,
    });
  } catch (error) {
    console.error('Error saving submission:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error processing submission',
      error: error.message,
    });
  }
};
