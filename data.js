/* EMOJI FOUNDERS — question data.
   Each round: emojis, answer, options (must include answer), year, fact.
   Max score auto-computes from the number of questions. */
window.EF = window.EF || {};

EF.QUESTIONS = [
  { emojis: ['\u{1F50D}', '\u{1F5FA}\uFE0F', '\u{1F4E7}'], answer: 'Google',
    options: ['Google', 'Apple', 'Amazon', 'Meta'],
    year: '1998', fact: 'Larry Page & Sergey Brin — it started as a research project called BackRub.' },
  { emojis: ['\u{1F34E}', '\u{1F4F1}', '\u{1F4BB}'], answer: 'Apple',
    options: ['Microsoft', 'Apple', 'Samsung', 'Sony'],
    year: '1976', fact: 'Jobs, Wozniak & Wayne — famously born in a garage.' },
  { emojis: ['\u{1F4E6}', '\u{1F6D2}', '\u{1F680}'], answer: 'Amazon',
    options: ['Alibaba', 'Shopify', 'Amazon', 'Walmart'],
    year: '1994', fact: 'Jeff Bezos started it as an online bookstore.' },
  { emojis: ['\u{1F465}', '\u{1F44D}', '\u{1F4D8}'], answer: 'Meta',
    options: ['Twitter', 'Meta', 'LinkedIn', 'Snapchat'],
    year: '2004', fact: 'Mark Zuckerberg launched TheFacebook from a Harvard dorm.' },
  { emojis: ['\u{1F697}', '\u26A1', '\u{1F50B}'], answer: 'Tesla',
    options: ['Rivian', 'Tesla', 'Ford', 'Toyota'],
    year: '2003', fact: 'Martin Eberhard & Marc Tarpenning founded it; Musk led the first big raise.' },
  { emojis: ['\u{1FA9F}', '\u{1F4BB}', '\u{1F3AE}'], answer: 'Microsoft',
    options: ['Sony', 'Nintendo', 'Microsoft', 'Steam'],
    year: '1975', fact: 'Gates & Allen built BASIC for the Altair 8800.' },
  { emojis: ['\u{1F3AC}', '\u{1F37F}', '\u{1F4FA}'], answer: 'Netflix',
    options: ['Hulu', 'Disney+', 'HBO', 'Netflix'],
    year: '1997', fact: 'Reed Hastings & Marc Randolph — DVDs by mail, no late fees.' },
  { emojis: ['\u2615', '\u{1F964}', '\u{1F7E2}'], answer: 'Starbucks',
    options: ['Dunkin', 'Starbucks', 'Costa', "Peet's"],
    year: '1971', fact: "Three friends, one store in Seattle's Pike Place Market." },
  { emojis: ['\u{1F3E8}', '\u2708\uFE0F', '\u{1F6CF}\uFE0F'], answer: 'Airbnb',
    options: ['Booking.com', 'Airbnb', 'Expedia', 'Vrbo'],
    year: '2008', fact: 'Chesky, Gebbia & Blecharczyk — three air mattresses on a floor.' },
  { emojis: ['\u{1F45F}', '\u2714\uFE0F', '\u{1F3C3}'], answer: 'Nike',
    options: ['Adidas', 'Puma', 'Nike', 'Reebok'],
    year: '1964', fact: 'Bowerman & Knight — as Blue Ribbon Sports. The Swoosh cost $35.' }
];

EF.POINTS_PER_QUESTION = 10;