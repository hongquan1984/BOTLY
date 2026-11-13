const crops = ["chamomile", "mint", "lavender", "ginger", "garlic", "spinach", "tomato", "potato", "basil", "berry"];

for (const name of crops) {
  try {
    const res = await fetch(`https://raw.githubusercontent.com/openfarmcc/open-crop-icons/master/svg/${name}.svg`);
    console.log("open-crop:", name, res.status);
  } catch (e) {
    console.log("open-crop:", name, "ERR", e.message);
  }
}
