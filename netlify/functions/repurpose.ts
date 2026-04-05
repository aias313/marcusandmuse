import type { Handler } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';
import * as cheerio from 'cheerio';
import { YoutubeTranscript } from 'youtube-transcript';
import { createClerkClient } from '@clerk/backend';

type Format = 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'blog' | 'email';

const FORMAT_SPECS: Record<Format, string> = {
  twitter:
    'A numbered thread of 5–8 tweets. Each tweet must be ≤280 characters. Separate tweets with "\\n\\n". Start each with its number e.g. "1/".',
  linkedin:
    'A professional LinkedIn post of 150–300 words. Include 3–5 relevant hashtags at the end.',
  instagram:
    'An Instagram caption of ≤150 words followed by a blank line and then 15–20 relevant hashtags.',
  facebook:
    'A conversational Facebook post of 100–200 words. Friendly, engaging tone.',
  blog:
    'A full blog post. Start with an H2 title (## Title), then an intro paragraph, then three H3 sections (### Section), then a conclusion paragraph. Total 500–800 words.',
  email:
    'An email newsletter. First line must be "Subject: <subject line>". Then a blank line. Then an intro paragraph, 2–3 body paragraphs, and a call-to-action. Total 200–350 words.',
};

async function fetchUrlContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; ContentEngine/1.0; +https://marcusandmuse.com)',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }
  const html = await response.text();
  const $ = cheerio.load(html);
  // Remove non-content elements
  $('script, style, nav, footer, header, aside, [role="navigation"], [role="banner"], [role="complementary"], .ad, .advertisement, .sidebar').remove();
  // Try to get main content, fall back to body
  const main =
    $('main, article, [role="main"], .content, .post-content, .entry-content').first();
  const text = main.length ? main.text() : $('body').text();
  // Normalise whitespace
  return text.replace(/\s+/g, ' ').trim().slice(0, 15000);
}

async function fetchYoutubeTranscript(url: string): Promise<string> {
  // Extract video ID from various YouTube URL formats
  const patterns = [
    /(?:v=|\/embed\/|\/v\/|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  ];
  let videoId: string | null = null;
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      videoId = match[1];
      break;
    }
  }
  if (!videoId) {
    throw new Error('Could not extract YouTube video ID from URL. Please check the URL and try again.');
  }
  const segments = await YoutubeTranscript.fetchTranscript(videoId);
  return segments
    .map((s) => s.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 15000);
}

function buildPrompt(sourceText: string, formats: Format[]): string {
  const specs = formats
    .map((f) => `- ${f}: ${FORMAT_SPECS[f]}`)
    .join('\n');
  return `Repurpose the following source content into the requested formats.
Return ONLY a valid JSON object with keys for each requested format. No markdown fences, no extra text.

Formats needed: ${formats.join(', ')}

Format specifications:
${specs}

Source content:
---
${sourceText}
---`;
}

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Verify Clerk JWT
  const authHeader = event.headers['authorization'] ?? event.headers['Authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    await clerk.verifyToken(token);
  } catch {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  // Parse and validate request body
  let inputType: string, content: string, formats: Format[];
  try {
    const body = JSON.parse(event.body ?? '{}');
    inputType = body.inputType;
    content = body.content;
    formats = body.formats;
    if (!inputType || !content || !Array.isArray(formats) || formats.length === 0) {
      throw new Error('Missing fields');
    }
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  // Extract source text
  let sourceText: string;
  try {
    if (inputType === 'url') {
      sourceText = await fetchUrlContent(content);
    } else if (inputType === 'video') {
      sourceText = await fetchYoutubeTranscript(content);
    } else {
      sourceText = content.trim().slice(0, 15000);
    }
    if (!sourceText) {
      throw new Error('No content could be extracted from the provided source.');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to extract content from source';
    return { statusCode: 422, headers, body: JSON.stringify({ error: message }) };
  }

  // Call Claude
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system:
        'You are an expert content repurposing assistant. Always respond with valid JSON only — no markdown fences, no preamble.',
      messages: [{ role: 'user', content: buildPrompt(sourceText, formats as Format[]) }],
    });

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Strip any accidental markdown fences before parsing
    const cleaned = rawText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    const results = JSON.parse(cleaned);

    return { statusCode: 200, headers, body: JSON.stringify({ results }) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Content generation failed';
    return { statusCode: 500, headers, body: JSON.stringify({ error: message }) };
  }
};
