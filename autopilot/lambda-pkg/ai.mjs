/**
 * AI content generator — calls AWS Bedrock (Claude Sonnet) to produce
 * structured page content matching the Truth Archive's tone and component schema.
 *
 * Auth: Lambda IAM role — no API key required.
 * Model: anthropic.claude-sonnet-4-5-20251001-v1:0
 */

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const MODEL_ID    = 'anthropic.claude-sonnet-4-5-20251001-v1:0';
const BEDROCK     = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

const SYSTEM_PROMPT = `You are a content researcher for The Truth Archive, a website documenting
conspiracy research, suppressed history, deep state operations, and alternative science.

Write with confident, assertive authority — state things as documented facts.
Cite real patents, court cases, government documents, whistleblower testimony, and
named institutions where possible. Never hedge with "allegedly", "some claim", or
"conspiracy theorists believe". State it directly.

Return ONLY valid JSON. No markdown fences, no explanation outside the JSON.`;

/**
 * Calls AWS Bedrock Claude Sonnet to generate structured page content for a topic.
 *
 * @param {Object} topic  - Topic entry from the queue
 * @returns {Promise<Object>} - Structured content object
 */
export async function generateContent(topic) {
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

  const resp = await BEDROCK.send(new ConverseCommand({
    modelId:  MODEL_ID,
    system:   [{ text: SYSTEM_PROMPT }],
    messages: [{ role: 'user', content: [{ text: userPrompt }] }],
    inferenceConfig: {
      maxTokens:   3200,
      temperature: 0.72,
    },
  }));

  const text = resp.output.message.content[0].text;
  // Strip any accidental markdown fences Claude may add
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(clean);
}


const SYSTEM_PROMPT = `You are a content researcher for The Truth Archive, a website documenting
conspiracy research, suppressed history, deep state operations, and alternative science.

Write with confident, assertive authority — state things as documented facts.
Cite real patents, court cases, government documents, whistleblower testimony, and
named institutions where possible. Never hedge with "allegedly", "some claim", or
"conspiracy theorists believe". State it directly.

Return ONLY valid JSON. No markdown fences, no explanation outside the JSON.`;

/**
 * Calls the GitHub Models API (OpenAI-compatible) to generate structured page
 * content for a given topic. Uses a GitHub PAT stored in SSM — no OpenAI
 * billing account required, covered by your GitHub Copilot subscription.
 *
 * @param {Object} topic          - Topic entry from the queue
 * @param {string} githubToken    - GitHub PAT from SSM (/ta/github-token)
 * @returns {Promise<Object>}     - Structured content object
 */
export async function generateContent(topic, githubToken) {
  const client = new OpenAI({
    apiKey:  githubToken,
    baseURL: GITHUB_MODELS_ENDPOINT,
  });

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
    model:           DEFAULT_MODEL,
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
