import { chromium } from 'file:///d:/botly/App/3DHOME/node_modules/playwright-core/index.mjs';
const out='D:/botly/App/reports/previews/final32-independent-review';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[]; page.on('pageerror',e=>errors.push(`pageerror ${e.message}`)); page.on('response',r=>{if(r.status()>=400) errors.push(`${r.status()} ${r.url()}`)}); page.on('requestfailed',r=>errors.push(`requestfailed ${r.url()} ${r.failure()?.errorText}`));
await page.addInitScript(()=>{localStorage.setItem('healthclues-onboarding-completed','true');localStorage.setItem('hc_onboarding_done','true');localStorage.setItem('guest_session',JSON.stringify({guest:true,nickname:'Lữ Khách'}))});
const shot=async n=>page.screenshot({path:`${out}-${n}.png`,fullPage:true});
const click=async t=>{let e=page.getByText(t,{exact:true}).first();await e.scrollIntoViewIfNeeded();await e.click();await page.waitForTimeout(300)};
try {
await page.goto('http://127.0.0.1:8100/world',{waitUntil:'networkidle'});
let skip=page.getByText('Bỏ qua',{exact:false}).first(); if(await skip.isVisible().catch(()=>false)) await skip.click();
await page.waitForTimeout(500); await page.mouse.click(335,123); await page.waitForTimeout(300);
await click('Giải Mã'); await click('BẮT ĐẦU ĐIỀU TRA'); await click('BẮT ĐẦU ĐIỀU TRA');
await page.waitForTimeout(500); await shot('gate0'); await page.getByText('Soi đủ 6 vật chứng',{exact:true}).click({force:true}); console.log('gate0',await page.getByText(/BẢNG KẾT LUẬN/).isVisible().catch(()=>false));
for (const [i,[x,y]] of [[125,235],[23,261],[369,298],[277,311],[86,339],[320,352]].entries()) {
 await page.mouse.click(x,y);await page.waitForTimeout(250);console.log('modal',i,(await page.locator('body').innerText()).slice(-900));if(i===0) { console.log('BEFORE_SAVE', (await page.locator('body').innerText()).slice(-1400)); await shot('before-save'); } if(i===1) { console.log('LAMP_MODAL', (await page.locator('body').innerText()).slice(-1400)); await shot('lamp-modal'); }
 let save=page.getByText('Lưu vào Sổ Manh Mối',{exact:false}).first(); if(!await save.isVisible()) throw Error('no modal '+i);await save.click();await page.waitForTimeout(200); if(i===0) { console.log('AFTER_SAVE', (await page.locator('body').innerText()).slice(-900)); await shot('after-save'); }
 if(i===4){await shot('gate5');await page.getByText('Soi đủ 6 vật chứng',{exact:true}).click({force:true}); console.log('gate5',await page.getByText(/BẢNG KẾT LUẬN/).isVisible().catch(()=>false));}
}
await shot('scene6');console.log('scene6 text',(await page.locator('body').innerText()).slice(-500)); await click('Sổ (6)');await shot('notebook6');await click('ĐẾN BẢNG KẾT LUẬN');await shot('board');console.log('board text',(await page.locator('body').innerText()));
console.log('controls',await page.locator('[role="button"]').allTextContents());
const phone='Sử dụng điện thoại trên giường';
for(const action of ['Chọn','Loại','Đánh dấu']) { await page.getByLabel(`${action} ${phone}`).click(); await page.waitForTimeout(250); console.log('state',action,(await page.locator('body').innerText()).match(/\d\/7 chứng cứ đang kết nối|[✓✕] 📱 Sử dụng điện thoại trên giường|[★☆]/g)); await shot(`card-${action}`); }
await page.getByLabel(`Đánh dấu ${phone}`).click();
await page.getByLabel('Chọn Ly cà phê Cold Brew trên bàn').click(); await click('ĐỐI CHIẾU KẾT LUẬN'); await shot('wrong'); console.log('wrong',(await page.locator('body').innerText()).slice(-1300));
await page.getByLabel('Chọn Ly cà phê Cold Brew trên bàn').click();
for(const label of [phone,'Lịch ngủ thất thường trong tuần','Làm việc căng thẳng khuya','Ánh sáng phòng & Cửa sổ không kéo rèm']) await page.getByLabel(`Chọn ${label}`).click();
await click('ĐỐI CHIẾU KẾT LUẬN'); await shot('checklist'); console.log('checklist',(await page.locator('body').innerText()).slice(-1800));
for(const action of ['Cất điện thoại và ngưng tiếp xúc màn hình sáng 45–60 phút trước khi ngủ.','Ngừng xử lý công việc trên Laptop ít nhất 1 tiếng trước giờ lên giường.','Kéo kín rèm cửa ban công và tắt các đèn sáng khi bắt đầu ngủ.','Cố định khung giờ đi ngủ – thức dậy đều đặn kể cả cuối tuần.']) {const item=page.getByText(action,{exact:false}).first(); await item.scrollIntoViewIfNeeded(); await item.click();}
await click('XÁC NHẬN CHECKLIST & NHẬN THƯỞNG'); await shot('solved'); console.log('SOLVED',await page.getByText('Hồ sơ đã phá giải hoàn toàn',{exact:true}).isVisible());
} catch(e){console.log('FAIL',e.stack);await shot('failure').catch(()=>{});} finally {console.log('ERRORS',JSON.stringify(errors));await browser.close()}
