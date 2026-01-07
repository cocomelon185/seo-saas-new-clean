const STOP_PHRASES = [
  'skip to main content',
  'skip to content',
  'menu',
  'features',
  'log in',
  'login',
  'sign in',
  'sign up'
];

// Extra noise fragments you’ve seen in tests
const JUNK_FRAGMENTS = [
  'for de checklist',
  'for de',
  'checklist',
  'guide'
];

// Leading phrases to trim from the start
const LEADING_PHRASES = [
  /^the best\s+/,
  /^best\s+/,
  /^learn about\s+/,
  /^what is\s+/,
  /^a guide to\s+/,
  /^complete guide to\s+/
];

function cleanTopic(raw) {
  if (!raw) return '';

  let topic = String(raw).trim();

  // Cut after first separator: | - – :
  const firstSep = topic.search(/[|\-–:]/);
  if (firstSep !== -1) {
    topic = topic.slice(0, firstSep).trim();
  }

  // Strip unwanted phrases seen in nav / boilerplate
  let lower = topic.toLowerCase();
  STOP_PHRASES.forEach(phrase => {
    const idx = lower.indexOf(phrase);
    if (idx !== -1) {
      topic = topic.slice(0, idx).trim();
      lower = topic.toLowerCase();
    }
  });

  // Normalize casing and spacing
  topic = topic.replace(/\s+/g, ' ').trim();
  lower = topic.toLowerCase();

  if (!lower) return '';

  // Remove junk fragments like "for de checklist"
  JUNK_FRAGMENTS.forEach(frag => {
    const re = new RegExp(frag, 'g');
    lower = lower.replace(re, ' ');
  });

  // Remove leading phrases ("the best", "what is", etc.)
  LEADING_PHRASES.forEach(re => {
    lower = lower.replace(re, '');
  });

  // Collapse spaces again
  lower = lower.replace(/\s+/g, ' ').trim();

  if (!lower) return '';

  // Heuristic: if it clearly comes from a SaaS page, prepend "saas"
  if (/saas/.test(raw.toString().toLowerCase()) && !/saas/.test(lower)) {
    lower = `saas ${lower}`;
  }

  // Title‑case for nicer display, but keep small words lowercase
  const SMALL_WORDS = ['and', 'or', 'for', 'to', 'of', 'in', 'on', 'a', 'an', 'the'];
  const pretty = lower
    .split(' ')
    .map((word, idx) => {
      const w = word.toLowerCase();
      if (idx > 0 && SMALL_WORDS.includes(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');

  return pretty;
}

module.exports = { cleanTopic };
