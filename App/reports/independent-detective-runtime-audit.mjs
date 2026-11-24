import fs from 'node:fs';

let code = fs.readFileSync('D:/botly/App/healthclues-mobile/scripts/qa_detective_bundle_round3.mjs', 'utf8');
code = code.replaceAll('mobile-detective-round3-', 'independent-8100-');
code = code.replace('const errors = [];', `const errors = [];
const missing = [];
page.on('response', response => { if (response.status() === 404) missing.push({ url: response.url(), type: response.request().resourceType() }); });
page.on('requestfailed', request => errors.push('requestfailed: ' + request.url() + ' ' + request.failure()?.errorText));`);
code = code.replace(/console\.log\("sceneSvgs"[^\n]+\n/, '');
code = code.replace('console.log("gate0 blocked");', `await page.screenshot({path: out + '/independent-8100-gate-0.png', fullPage: true}); console.log('gate0 blocked');`);
code = code.replace('console.log("gate5 blocked");', `await page.screenshot({path: out + '/independent-8100-gate-5.png', fullPage: true}); console.log('gate5 blocked');`);
code = code.replace('await page.screenshot({ path: `${out}/independent-8100-scene-all-clues.png`, fullPage: true });', `if(inspected !== 6 || !(await page.getByText('Sổ (6)', {exact: true}).isVisible())) throw new Error('Six saved clues not observed');\nawait page.screenshot({ path: \`${'${out}'}/independent-8100-scene-all-clues.png\`, fullPage: true });`);
code = code.replace('console.log("wrongClicked", await clickLabel("Ly cà phê Cold Brew trên bàn"));', `if (!await clickLabel('Ly cà phê Cold Brew trên bàn')) throw new Error('wrong hypothesis unavailable');`);
code = code.replace('await page.screenshot({ path: `${out}/independent-8100-wrong-answer.png`, fullPage: true });', `await page.screenshot({ path: \`${'${out}'}/independent-8100-wrong-answer.png\`, fullPage: true }); console.log('wrongFeedback', (await page.locator('body').innerText()).slice(-1000));`);
code = code.replace('console.log("solvedVisible", await page.getByText("Hồ sơ đã phá giải hoàn toàn", { exact: true }).isVisible().catch(() => false));', `const solved = await page.getByText('Hồ sơ đã phá giải hoàn toàn', {exact:true}).isVisible().catch(() => false); console.log('solvedVisible', solved); if(!solved) throw new Error('solved not observed'); console.log('http404', JSON.stringify(missing));`);
await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
