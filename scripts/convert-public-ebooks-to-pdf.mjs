import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const books = [
  ['pg-18487.epub', 'food-remedies-pdf.pdf'],
  ['pg-78781.epub', 'healthy-life-beverage-book-pdf.pdf'],
  ['pg-53951.epub', 'a-book-of-simples-pdf.pdf'],
  ['pg-49513.epub', 'complete-herbal-pdf.pdf'],
];
const sourceDir = path.resolve('data/private-ebooks');
const outputDir = path.resolve('data/private-ebooks');

function zipEntries(buffer) {
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('EPUB ZIP directory is missing');
  const count = buffer.readUInt16LE(eocd + 10);
  let cursor = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error('Invalid EPUB ZIP directory');
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.toString('utf8', cursor + 46, cursor + 46 + nameLength);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(start, start + compressedSize);
    const bytes = method === 0 ? compressed : method === 8 ? inflateRawSync(compressed) : null;
    if (!bytes) throw new Error(`Unsupported EPUB compression method ${method}`);
    entries.set(name, bytes);
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function decodeEntities(text) {
  return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_, entity) => {
    if (entity[0] === '#') {
      const n = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return String.fromCodePoint(n);
    }
    return ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[entity.toLowerCase()];
  });
}

function textBlocks(xhtml) {
  const text = xhtml
    .replace(/<(script|style|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|h[1-6]|li|tr|blockquote|pre|div|section|article|title)\s*>/gi, '\n\n')
    .replace(/<[^>]*>/g, ' ');
  return decodeEntities(text).replace(/\r/g, '').split(/\n+/)
    .map((line) => line.replace(/[\t ]+/g, ' ').trim())
    .filter(Boolean)
    .map((line) => line.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[—–]/g, '--')
      .replace(/[^\x20-\x7E]/g, ' '));
}

function pageBlocks(xhtml, xhtmlPath) {
  const blocks = [];
  const addText = (fragment) => blocks.push(...textBlocks(fragment).map((text) => ({ type: 'text', text })));
  let cursor = 0;
  for (const match of xhtml.matchAll(/<img\b[^>]*>/gi)) {
    addText(xhtml.slice(cursor, match.index));
    const src = match[0].match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (src) {
      const asset = decodeURIComponent(src.split(/[?#]/)[0]);
      blocks.push({ type: 'image', path: path.posix.normalize(path.posix.join(path.posix.dirname(xhtmlPath), asset)) });
    }
    cursor = match.index + match[0].length;
  }
  addText(xhtml.slice(cursor));
  return blocks;
}

function wrap(text, font, size, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}

async function convert(inputName, outputName) {
  const entries = zipEntries(await readFile(path.join(sourceDir, inputName)));
  const container = entries.get('META-INF/container.xml')?.toString('utf8') || '';
  const opfPath = container.match(/full-path="([^"]+)"/)?.[1];
  if (!opfPath) throw new Error(`${inputName}: EPUB package path is missing`);
  const opf = entries.get(opfPath)?.toString('utf8') || '';
  const base = path.posix.dirname(opfPath);
  const title = decodeEntities(opf.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i)?.[1] || inputName.replace('.epub', ''))
    .replace(/<[^>]+>/g, '').trim();
  const manifest = new Map();
  for (const item of opf.matchAll(/<item\b([^>]+)\/?\s*>/gi)) {
    const id = item[1].match(/\bid="([^"]+)"/)?.[1];
    const href = item[1].match(/\bhref="([^"]+)"/)?.[1];
    const media = item[1].match(/\bmedia-type="([^"]+)"/)?.[1];
    if (id && href && media?.includes('xhtml')) manifest.set(id, path.posix.normalize(path.posix.join(base, decodeURIComponent(href))));
  }
  const spine = [...opf.matchAll(/<itemref\b[^>]*\bidref="([^"]+)"[^>]*\/?\s*>/gi)].map((match) => manifest.get(match[1])).filter(Boolean);
  const content = [];
  for (const entry of spine) {
    const page = entries.get(entry)?.toString('utf8');
    if (page) content.push(...pageBlocks(page, entry));
  }
  if (!content.some((block) => block.type === 'text')) throw new Error(`${inputName}: no readable book text found`);

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const pageSize = [612, 792];
  const margin = 54;
  const size = 10;
  const leading = 14;
  const coverPath = [...entries.keys()].find((name) => /cover\.(jpe?g|png)$/i.test(name));
  let page = pdf.addPage(pageSize);
  let y = pageSize[1] - margin;
  const bodyWidth = pageSize[0] - margin * 2;
  const footer = (number) => page.drawText(String(number), { x: pageSize[0] / 2 - 4, y: 28, size: 8, font, color: rgb(0.45, 0.45, 0.45) });
  let pageNumber = 1;
  const newPage = () => { footer(pageNumber++); page = pdf.addPage(pageSize); y = pageSize[1] - margin; };
  const embedImage = async (imagePath) => {
    const bytes = entries.get(imagePath);
    if (!bytes) return null;
    const imageData = Uint8Array.from(bytes);
    if (/\.png$/i.test(imagePath) && imageData[0] === 0x89 && imageData[1] === 0x50) return pdf.embedPng(imageData);
    if (/\.jpe?g$/i.test(imagePath) && imageData[0] === 0xff && imageData[1] === 0xd8) return pdf.embedJpg(imageData);
    return null;
  };
  if (coverPath) {
    const cover = await embedImage(coverPath);
    if (cover) {
      const scale = Math.min(420 / cover.width, 500 / cover.height);
      const width = cover.width * scale;
      const height = cover.height * scale;
      page.drawImage(cover, { x: (pageSize[0] - width) / 2, y: 180, width, height });
    }
  }
  const titleLines = wrap(title, bold, 21, bodyWidth);
  for (const line of titleLines) {
    page.drawText(line, { x: margin, y: 125, size: 21, font: bold, color: rgb(0.1, 0.18, 0.16) });
    y = 125 - 28;
  }
  page.drawText('A PDF reading copy of the original ebook', { x: margin, y: 91, size: 10, font, color: rgb(0.35, 0.42, 0.38) });
  page = pdf.addPage(pageSize);
  y = pageSize[1] - margin;
  const embeddedImages = new Map();
  for (const block of content) {
    if (block.type === 'image') {
      if (!embeddedImages.has(block.path)) embeddedImages.set(block.path, await embedImage(block.path));
      const image = embeddedImages.get(block.path);
      if (!image) continue;
      const scale = Math.min(bodyWidth / image.width, 260 / image.height, 1);
      const width = image.width * scale;
      const height = image.height * scale;
      if (y - height < margin + 18) newPage();
      page.drawImage(image, { x: margin + (bodyWidth - width) / 2, y: y - height, width, height });
      y -= height + 12;
      continue;
    }
    const lines = wrap(block.text, font, size, bodyWidth);
    if (y - lines.length * leading < margin + 18) newPage();
    for (const line of lines) {
      page.drawText(line, { x: margin, y, size, font, color: rgb(0.12, 0.12, 0.12) });
      y -= leading;
    }
    y -= 5;
  }
  footer(pageNumber);
  pdf.setTitle(title);
  pdf.setSubject('PDF reading copy generated from the original Project Gutenberg EPUB; source text, embedded license, and referenced illustrations are retained.');
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, outputName), await pdf.save());
  console.log(`${outputName}: ${pdf.getPageCount()} pages`);
}

for (const [input, output] of books) await convert(input, output);
