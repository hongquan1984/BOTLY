const url = 'https://www.botly.vn/_next/static/immutable/chunks/1pf-v0z9kech8.css';
const res = await fetch(url);
const text = await res.text();
console.log('Total css length:', text.length);
const fontFaces = text.match(/@font-face\s*\{[^}]+\}/g);
console.log('Font faces count:', fontFaces ? fontFaces.length : 0);
if (fontFaces) {
  fontFaces.forEach(f => console.log('--- Font face:\n', f));
}
