async function check() {
  const html = await (await fetch('https://www.botly.vn/play')).text();
  const cssMatches = Array.from(html.matchAll(/href="(\/_next\/static\/[^"]+\.css)"/g)).map(m => m[1]);
  console.log('CSS links:', cssMatches);
  for (const href of cssMatches) {
    const css = await (await fetch('https://www.botly.vn' + href)).text();
    if (css.includes('hc-rpg-')) {
      console.log('Found hc-rpg in', href, 'length:', css.length);
      console.log('has mystery-icon:', css.includes('hc-rpg-mystery-icon'));
      console.log('has hc-quest-change-habit-btn:', css.includes('hc-quest-change-habit-btn'));
      console.log('has hc-mobile-room-card:', css.includes('hc-mobile-room-card'));
    }
  }
}
check().catch(console.error);
