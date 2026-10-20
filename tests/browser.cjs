'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');

(async () => {
  const server = spawn('python3', ['-m', 'http.server', '8080', '--bind', '127.0.0.1', '--directory', 'dist'], {stdio:'ignore'});
  let browser;
  const results = [];
  try {
    for (let i=0; i<100; i++) {
      try { const r=await fetch('http://127.0.0.1:8080'); if(r.ok)break; } catch {}
      if(i===99)throw Error('Local test server did not start');
      await new Promise(r=>setTimeout(r,100));
    }
    await fs.mkdir('test-results',{recursive:true});
    browser=await chromium.launch();
    async function scenario(name,fn,options={}) {
      const context=await browser.newContext({viewport:{width:1440,height:1000},...options});
      const page=await context.newPage();
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      try {
        await fn(page,context);
        assert.deepEqual(errors,[],'No uncaught page errors');
        results.push({name,status:'passed'});
        console.log('PASS '+name);
      } catch(error) {
        results.push({name,status:'failed',error:error.stack});
        await page.screenshot({path:'test-results/'+name+'-failure.png',fullPage:true}).catch(()=>{});
        console.error('FAIL '+name+'\n'+error.stack);
      } finally { await context.close(); }
    }
    const url='http://127.0.0.1:8080/';
    const visible=async locator=>{await locator.waitFor({state:'visible',timeout:5000});};
    await scenario('desktop-navigation-and-library',async(page)=>{
      await page.goto(url);
      await visible(page.getByRole('heading',{name:'Uma história espera por você.'}));
      await page.getByRole('button',{name:'+ Salvar',exact:true}).click();
      await page.getByRole('link',{name:'▤ Minha biblioteca'}).click();
      await visible(page.getByRole('heading',{name:'O jardim das horas esquecidas'}));
      await page.reload();
      await visible(page.getByRole('button',{name:'✓ Na biblioteca'}));
      await page.getByRole('link',{name:'⌂ Descobrir'}).click();
      await page.getByRole('button',{name:'Romance',exact:true}).click();
      await visible(page.getByRole('heading',{name:'Onde o sol encontra o mar'}));
      assert.equal(await page.getByRole('heading',{name:'O jardim das horas esquecidas'}).count(),0);
      await page.getByRole('button',{name:'Todos',exact:true}).click();
      await page.getByRole('link',{name:'Explorar a história ↗'}).click();
      await visible(page.getByRole('heading',{name:'A porta que lembrava'}));
      await page.screenshot({path:'test-results/desktop-reader.png',fullPage:true});
    });
    await scenario('hover-popup-and-dismissal',async(page)=>{
      await page.goto(url+'#reader');
      const marker=page.getByRole('button',{name:'✧ Ver microcena',exact:true});
      await marker.hover();
      const popup=page.getByRole('region',{name:'Prévia da microcena'});
      await visible(popup);
      await page.getByRole('button',{name:'▷ Reproduzir microcena'}).click();
      await visible(page.getByRole('button',{name:'Ⅱ Pausar microcena'}));
      await page.getByRole('button',{name:'Ⅱ Pausar microcena'}).click();
      await page.screenshot({path:'test-results/desktop-popup.png'});
      await page.getByRole('button',{name:'Fechar microcena'}).click();
      assert.equal(await popup.count(),0);
      await marker.click();
      await visible(popup);
      await page.keyboard.press('Escape');
      assert.equal(await popup.count(),0);
    });
    await scenario('studio-validation-and-persistence',async(page)=>{
      await page.goto(url+'#studio');
      await page.getByLabel('Nome da obra',{exact:true}).fill('Obra de teste Lenora');
      await page.getByLabel('Título do capítulo',{exact:true}).fill('Capítulo de validação');
      await page.getByLabel('Frase exata no texto',{exact:true}).fill('âncora inexistente');
      await page.getByRole('button',{name:'Salvar rascunho',exact:true}).click();
      await visible(page.getByRole('status').filter({hasText:'A frase do efeito não foi encontrada'}));
      await page.getByLabel('Frase exata no texto',{exact:true}).fill('três badaladas');
      await page.getByRole('button',{name:'Salvar e visualizar ↗'}).click();
      await visible(page.getByRole('heading',{name:'Capítulo de validação'}));
      await page.reload();
      await visible(page.getByRole('heading',{name:'Capítulo de validação'}));
      await page.getByRole('link',{name:'✎ Estúdio do autor'}).click();
      await page.getByRole('button',{name:'Restaurar versão anterior'}).click();
      assert.equal(await page.getByLabel('Título do capítulo',{exact:true}).inputValue(),'A porta que lembrava');
    });
    await scenario('automatic-popup-consent-and-no-repeat',async(page)=>{
      await page.goto(url+'#studio');
      await page.getByLabel('Abertura sugerida',{exact:true}).selectOption('auto');
      await page.getByRole('button',{name:'Salvar e visualizar ↗'}).click();
      await page.getByLabel('Modo de leitura',{exact:true}).selectOption('pages');
      for(let i=0;i<4;i++)await page.getByRole('button',{name:'Próximo →',exact:true}).click();
      assert.equal(await page.locator('#scenePopup').count(),0,'Author cannot force popup without reader consent');
      await page.getByRole('button',{name:'⚙ Interações'}).click();
      await page.getByLabel('Permitir popup automático sugerido pelo autor').check();
      await page.getByRole('button',{name:'Aplicar preferências'}).click();
      await visible(page.getByRole('region',{name:'Prévia da microcena'}));
      assert.equal(await page.locator('#scene').evaluate(e=>e.classList.contains('playing')),false,'Opening is not autoplay');
      await page.getByRole('button',{name:'Fechar microcena'}).click();
      await page.getByRole('button',{name:'← Anterior',exact:true}).click();
      await page.getByRole('button',{name:'Próximo →',exact:true}).click();
      assert.equal(await page.locator('#scenePopup').count(),0,'No second automatic popup in session');
    });
    await scenario('plain-reading-and-audio-stop',async(page)=>{
      await page.goto(url+'#reader');
      await page.getByRole('button',{name:'♫ Ativar áudio'}).click();
      await visible(page.getByRole('button',{name:'♫ Desativar áudio'}));
      await page.getByRole('button',{name:'⚙ Interações'}).click();
      await page.getByLabel('Ler sem nenhuma interação').check();
      await page.getByRole('button',{name:'Aplicar preferências'}).click();
      assert.equal(await page.locator('.interactive').count(),0);
      assert.equal(await page.locator('#sceneTrigger').count(),0);
      await visible(page.getByRole('button',{name:'♫ Ativar áudio'}));
      await page.reload();
      assert.equal(await page.locator('.interactive').count(),0);
    });
    await scenario('mobile-popup-and-layout',async(page)=>{
      await page.goto(url+'#reader');
      await page.getByRole('button',{name:'✧ Ver microcena',exact:true}).tap();
      await visible(page.getByRole('region',{name:'Prévia da microcena'}));
      const box=await page.locator('#scenePopup').boundingBox();
      assert.ok(box.x>=0&&box.x+box.width<=390,'Popup within screen');
      assert.ok(box.y>=0&&box.y+box.height<=844,'Popup within height');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
      await page.screenshot({path:'test-results/mobile-popup.png',fullPage:true});
      await page.getByRole('button',{name:'▷ Reproduzir microcena'}).tap();
      await visible(page.getByRole('button',{name:'Ⅱ Pausar microcena'}));
      await page.getByRole('button',{name:'Fechar microcena'}).tap();
      assert.equal(await page.locator('#scenePopup').count(),0);
    },{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await scenario('image-upload-session-only',async(page)=>{
      await page.goto(url+'#studio');
      await page.locator('#sceneUpload').setInputFiles({name:'scene.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="green"/></svg>')});
      await page.getByRole('button',{name:'Salvar e visualizar ↗'}).click();
      await page.getByRole('button',{name:'✧ Ver microcena',exact:true}).click();
      await visible(page.getByRole('img',{name:'Ilustração enviada pelo autor'}));
      await page.reload();
      await page.getByRole('button',{name:'✧ Ver microcena',exact:true}).click();
      await visible(page.getByRole('button',{name:'▷ Reproduzir microcena'}));
    });
    await fs.writeFile('test-results/results.json',JSON.stringify(results,null,2));
    if(results.some(r=>r.status==='failed'))process.exitCode=1;
  } finally {
    if(browser)await browser.close();
    server.kill();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
