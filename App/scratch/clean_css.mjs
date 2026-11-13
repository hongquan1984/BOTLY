import fs from "node:fs";

let css = fs.readFileSync("D:\\botly\\src\\components\\healthclues\\healthclues-landing.css", "utf8");

// Remove all Google Font @import
css = css.replace(/@import url\('https:\/\/fonts\.googleapis\.com\/css2\?[^']+'\);\s*/g, "");

// Add clean @import at line 1
const importUrl = "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');\n\n";
css = importUrl + css;

// Replace font variables to prioritize next/font/google and never use Georgia
css = css.replace(/--font-serif:\s*'Playfair Display',\s*Georgia,\s*serif;/g, "--font-serif: var(--font-serif), 'Playfair Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;");
css = css.replace(/--font-brand:\s*'Cinzel',\s*Georgia,\s*serif;/g, "--font-brand: var(--font-brand), 'Cinzel', serif;");
css = css.replace(/--font-sans:\s*'Plus Jakarta Sans',\s*-apple-system,\s*BlinkMacSystemFont,\s*"Segoe UI",\s*Roboto,\s*sans-serif;/g, "--font-sans: var(--font-sans), 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;");

fs.writeFileSync("D:\\botly\\src\\components\\healthclues\\healthclues-landing.css", css, "utf8");
console.log("Cleaned healthclues-landing.css successfully.");

// Also sync to LADIPAGE/styles.css
fs.writeFileSync("D:\\botly\\LADIPAGE\\styles.css", css, "utf8");
console.log("Synced to LADIPAGE/styles.css successfully.");
