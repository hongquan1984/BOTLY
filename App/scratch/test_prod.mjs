const res = await fetch('https://www.botly.vn/healthclues');
const html = await res.text();
console.log('HTML length:', html.length);
const cssLinks = html.match(/href="[^"]+\.css"/g);
console.log('CSS links:', cssLinks);

for (const link of (cssLinks || [])) {
  const url = 'https://www.botly.vn' + link.slice(6, -1);
  const cssRes = await fetch(url);
  const cssText = await cssRes.text();
  console.log(url, 'has Playfair Display:', cssText.includes('Playfair Display') || cssText.includes('playfair'));
}
