const icons = [
  "yoga", "fish", "meat", "apple", "carrot", "egg", "cup", "droplet", 
  "moon", "sun", "device-mobile-off", "walk", "run", "bike", "swimming", 
  "stretching", "bell", "leaf", "flower", "bottle", "cookie-off", "salt",
  "book", "sparkles", "trophy", "shield", "swords", "check", "feather", "chest"
];

for (const name of icons) {
  try {
    const res = await fetch(`https://cdn.jsdelivr.net/npm/@tabler/icons@3.28.0/icons/outline/${name}.svg`);
    console.log(name, res.status);
  } catch (e) {
    console.log(name, "ERR", e.message);
  }
}
