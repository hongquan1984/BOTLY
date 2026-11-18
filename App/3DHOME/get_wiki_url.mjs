async function getUrl() {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&titles=File:Grindelwald_360_Grad_2022.jpg&prop=imageinfo&iiprop=url|size&format=json';
  const res = await fetch(url, { headers: { 'User-Agent': 'BotlySwissVillage/1.0 (contact@botly.app)' } });
  const data = await res.json();
  const pages = data.query.pages;
  const pageId = Object.keys(pages)[0];
  const info = pages[pageId].imageinfo[0];
  console.log('Direct URL:', info.url);
  console.log('Width:', info.width, 'Height:', info.height, 'Size:', info.size);
}
getUrl();
