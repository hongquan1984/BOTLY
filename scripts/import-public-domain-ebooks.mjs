import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';

// Keep the original Project Gutenberg EPUB unchanged, including its embedded
// license and source credits. Botly display covers remain separate assets.
const ebooks = [18487, 78781, 53951, 49513];
const outputDir = path.resolve('data/private-ebooks');
await mkdir(outputDir, { recursive: true });

for (const id of ebooks) {
  const response = await fetch(`https://www.gutenberg.org/ebooks/${id}.epub3.images`);
  if (!response.ok || !response.headers.get('content-type')?.includes('application/epub+zip')) {
    throw new Error(`Project Gutenberg ebook ${id} was not returned as an EPUB (${response.status})`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 50_000 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error(`Project Gutenberg ebook ${id} failed the EPUB/ZIP file check`);
  }
  const filePath = path.join(outputDir, `pg-${id}.epub`);
  await writeFile(filePath, bytes);
  console.log(`Imported ${id}: ${bytes.length} bytes`);
}

// Wellcome marks these two digitised works Public Domain Mark and makes their
// complete, source-generated PDFs available through its official IIIF endpoint.
for (const [recordId, workId] of [['pkcssp5m', 'b21528433'], ['yyu6fnvg', 'b21908679']]) {
  const response = await fetch(`https://iiif.wellcomecollection.org/pdf/${workId}`);
  if (!response.ok || !response.headers.get('content-type')?.includes('application/pdf')) {
    throw new Error(`Wellcome work ${recordId} was not returned as a PDF (${response.status})`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 100_000 || bytes.subarray(0, 5).toString() !== '%PDF-') {
    throw new Error(`Wellcome work ${recordId} failed the PDF file check`);
  }
  const filePath = path.join(outputDir, `wellcome-${workId}.pdf`);
  await writeFile(filePath, bytes);
  console.log(`Imported Wellcome ${recordId}: ${bytes.length} bytes`);
}

// Supabase's configured bucket limit is 50 MB. Split the 459-page Herbal
// Simples scan at a page boundary; the page content itself stays unchanged.
const scanPath = path.join(outputDir, 'wellcome-b21908679.pdf');
const scan = await PDFDocument.load(await readFile(scanPath));
const midpoint = Math.ceil(scan.getPageCount() / 2);
for (const [part, start, end] of [[1, 0, midpoint], [2, midpoint, scan.getPageCount()]]) {
  const volume = await PDFDocument.create();
  const pages = await volume.copyPages(scan, Array.from({ length: end - start }, (_, i) => start + i));
  pages.forEach(page => volume.addPage(page));
  const bytes = await volume.save({ useObjectStreams: true });
  const filePath = path.join(outputDir, `wellcome-b21908679-part-${part}.pdf`);
  await writeFile(filePath, bytes);
  if (bytes.length >= 50_000_000) throw new Error(`Wellcome volume ${part} exceeds the storage bucket limit`);
  console.log(`Prepared Wellcome volume ${part}: ${pages.length} pages, ${bytes.length} bytes`);
}
await unlink(scanPath);
