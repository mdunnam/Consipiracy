/**
 * AI content generator — calls OpenAI to produce structured page content
 * that matches the Truth Archive's tone and component schema.
 */

import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are a content researcher for The Truth Archive, a website documenting
conspiracy research, suppressed history, deep state operations, and alternative science.

Write with confident, assertive authority — state things as documented facts.
Cite real patents, court cases, government documents, whistleblower testimony, and
named institutions where possible. Never hedge with "allegedly", "some claim", or
"conspiracy theorists believe". State it directly.

Return ONLY valid JSON. No markdown fences, no explanation outside the JSON.`;

/**
 * Calls OpenAI to generate structured page content for a given topic.
 *
 * @param {Object} topic        - Topic entry from the queue
 * @param {string} openaiApiKey - OpenAI API key from SSM
 * @returns {Promise<Object>}   - Structured content object
 */
export async function generateContent(topic, openaiApiKey) {
  const client = new OpenAI({ apiKey: openaiApiKey });

  const userPrompt = `Generate a comprehensive research page for: "${topic.title}"

Category: ${topic.section}
Keywords: ${(topic.keywords || []).join(', ')}
Related topics (for cross-refs): ${(topic.relatedSlugs || []).join(', ')}

Requirements:
- subtitle: 2 punchy sentences that hook the reader — state the scandal/suppression directly
- 2–3 h2 sections with 2 paragraphs each — cite real dates, names, agencies, patents
- 1 alert_box: titled with a theme (e.g. "Documented Government Admission"), content = a hard list of sourced facts
- 3–4 connection_nodes numbered "01"–"04": short punchy revelations (title + 2 sentences max each)
- 3–4 cross_refs using slugs from this list: ${(topic.relatedSlugs || []).join(', ')}

Return this exact JSON shape:
{
  "subtitle": "string",
  "sections": [
    { "type": "h2+paragraphs", "heading": "string", "paragraphs": ["string", "string"] },
    { "type": "alert_box", "label": "string", "content": "string" },
    { "type": "connection_nodes", "nodes": [{ "number": "01", "title": "string", "content": "string" }] }
  ],
  "cross_refs": [
    { "slug": "string", "map": "string", "title": "string" }
  ]
}`;

  const resp = await client.chat.completions.create({
    model:           'gpt-4o',
    messages:        [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature:     0.72,
    max_tokens:      3200,
  });

  return JSON.parse(resp.choices[0].message.content);
}
