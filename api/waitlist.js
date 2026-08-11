// Waitlist submission endpoint.
// Mirrors the memery-homepage implementation: persists leads into the shared
// Supabase `waitlist_submissions` table, tagged with from_source = 'megahit'.
// Uses the Supabase REST API via global fetch so the static site needs no
// dependencies and no build step.

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
