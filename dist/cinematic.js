'use strict';
// One renderer is shared by the author, the reader and the silent WebM exporter.
globalThis.LenoraCinema={
  loadVideo(video,src){return new Promise((resolve,reject)=>{
    let scanning=false,settled=false;const timer=setTimeout(()=>done(Error('Vídeo sem duração legível ou formato incompatível.')),15000);
    function done(error){if(settled)return;settled=true;clearTimeout(timer);video.onloadeddata=null;video.onerror=null;video.ontimeupdate=null;video.onseeked=null;error?reject(error):resolve(video.duration);}
    function inspect(){
      if(Number.isFinite(video.duration)&&video.duration>0){if(scanning){scanning=false;video.onseeked=()=>done();video.currentTime=0;}else if(video.readyState>=2)done();}
      else if(video.readyState>=2&&!scanning){scanning=true;video.currentTime=1e10;}
    }
    video.preload='auto';video.muted=true;video.playsInline=true;video.onloadeddata=inspect;video.ontimeupdate=inspect;video.onerror=()=>done(Error('Formato de vídeo não reproduzível.'));video.src=src;
  });},
  mount(host,clips,{getAsset,esc,toast,exportable=false}){
    const S=globalThis.LenoraScenes,total=clips.reduce((n,c)=>n+c.duration,0);
    let resources=[],ready=false,disposed=false,playing=false,time=0,raf=0,last=0,active=-1,recorder=null,stream=null,recording=false;
    host.innerHTML=`<div class="cinema-screen"><canvas width="1280" height="720" aria-label="Sequência visual criada pelo autor"></canvas><p class="cinema-state" role="status">Preparando sequência…</p></div><div class="cinema-controls"><button type="button" data-play disabled>Reproduzir</button><button type="button" data-restart disabled>Reiniciar</button><label class="sr-only">Posição da sequência</label><input aria-label="Posição da sequência" type="range" min="0" max="${total}" step="0.01" value="0" disabled><output>0.0 / ${total.toFixed(1)} s</output>${exportable?'<button type="button" data-export disabled>Exportar WebM sem áudio</button>':''}</div>`;
    const canvas=host.querySelector('canvas'),ctx=canvas.getContext('2d'),state=host.querySelector('[role=status]'),play=host.querySelector('[data-play]'),slider=host.querySelector('input'),restart=host.querySelector('[data-restart]'),exportButton=host.querySelector('[data-export]');
    function pause(){playing=false;cancelAnimationFrame(raf);resources.forEach(r=>{if(r?.tagName==='VIDEO')r.pause();});play.textContent='Reproduzir';if(recording)finish(false);}
    function finish(save){
      if(!recorder||recorder.state==='inactive')return;
      recording=false;recorder.saveResult=save;recorder.stop();
      if(exportButton)exportButton.textContent='Exportar WebM sem áudio';
    }
    function draw(index,local,alpha=1,x=0,scale=1){
      const r=resources[index],c=clips[index];if(!r||!c)return;
      const w=r.videoWidth||r.naturalWidth,h=r.videoHeight||r.naturalHeight;if(!w||!h)return;
      const f=Math.max(0,Math.min(1,local/c.duration)),motion=matchMedia('(prefers-reduced-motion: reduce)').matches?'still':c.movement;
      let z=scale*(motion==='in'?1+.12*f:motion==='out'?1.12-.12*f:1.04);
      if(motion==='still')z=scale;
      const ratio=Math.max(1280/w,720/h)*z,dx=motion==='left'?-50*f:motion==='right'?50*f:0;
      ctx.save();ctx.globalAlpha=alpha;ctx.translate(x+dx,0);ctx.drawImage(r,(1280-w*ratio)/2,(720-h*ratio)/2,w*ratio,h*ratio);ctx.restore();
    }
    function render(){
      if(!ready||disposed)return;
      const f=S.frameAt(clips,time);if(!f)return;
      const c=clips[f.index],r=resources[f.index];
      if(active!==f.index){resources.forEach(v=>{if(v.tagName==='VIDEO')v.pause();});active=f.index;if(r.tagName==='VIDEO'){r.currentTime=Math.min(Math.max(0,r.duration-.02),c.start+f.local);if(playing)r.play().catch(()=>{pause();toast('Não foi possível reproduzir este vídeo.');});}}
      ctx.fillStyle='#050a0e';ctx.fillRect(0,0,1280,720);
      const transition=matchMedia('(prefers-reduced-motion: reduce)').matches&&!recording?'cut':c.transition;
      const mix=Math.min(1,f.local/Math.min(.65,c.duration/2));
      if(f.index&&mix<1&&transition!=='cut'){
        if(transition==='black'){if(mix<.5)draw(f.index-1,clips[f.index-1].duration,1-mix*2);else draw(f.index,f.local,(mix-.5)*2);}
        else{draw(f.index-1,clips[f.index-1].duration);draw(f.index,f.local,transition==='dissolve'?mix:1,transition==='slide'?1280*(1-mix):0,transition==='zoom'?1.25-.25*mix:1);}
      }else draw(f.index,f.local);
      slider.value=time;host.querySelector('output').textContent=`${time.toFixed(1)} / ${total.toFixed(1)} s`;
    }
    function tick(now){if(!playing||disposed)return;time=Math.min(total,time+(now-last)/1000);last=now;render();if(time>=total){if(recording)finish(true);pause();return;}raf=requestAnimationFrame(tick);}
    function start(){if(time>=total)time=0;active=-1;playing=true;play.textContent='Pausar';last=performance.now();render();raf=requestAnimationFrame(tick);}
    play.onclick=()=>playing?pause():start();
    function seek(value){pause();time=value;active=-1;render();const r=resources[S.frameAt(clips,time)?.index];if(r?.tagName==='VIDEO')r.onseeked=()=>render();}
    restart.onclick=()=>seek(0);slider.oninput=()=>seek(Number(slider.value));
    if(exportButton)exportButton.onclick=()=>{
      if(recording){pause();toast('Exportação cancelada.');return;}
      if(!canvas.captureStream||!globalThis.MediaRecorder||!MediaRecorder.isTypeSupported('video/webm')){toast('Este navegador não oferece exportação WebM. Use um navegador compatível.');return;}
      pause();time=0;active=-1;render();
      try{
        stream=canvas.captureStream(30);const chunks=[];recorder=new MediaRecorder(stream,{mimeType:'video/webm'});
        recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
        const currentRecorder=recorder,currentStream=stream;
        recorder.onstop=()=>{currentStream.getTracks().forEach(t=>t.stop());if(currentRecorder.saveResult&&!disposed){const url=URL.createObjectURL(new Blob(chunks,{type:'video/webm'})),a=document.createElement('a');a.href=url;a.download='lenora-cena.webm';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('Vídeo sem áudio exportado.');}};
        recorder.onerror=()=>{pause();toast('A exportação falhou. Tente novamente neste navegador.');};
        recorder.start();recording=true;exportButton.textContent='Cancelar exportação';toast('Gravando em tempo real. Mantenha esta aba aberta até terminar.');start();
      }catch{stream?.getTracks().forEach(t=>t.stop());toast('Não foi possível exportar a sequência neste navegador.');}
    };
    const loading=clips.map(c=>{
      const asset=getAsset(c.key)||(c.src?{url:c.src}:null);if(!asset)return Promise.reject(Error('Arquivo não encontrado neste navegador: '+c.name));
      const r=document.createElement(c.type==='video'?'video':'img');resources.push(r);
      if(c.type==='video')return LenoraCinema.loadVideo(r,asset.url).then(duration=>{if(c.start+c.duration>duration+.1)throw Error('O trecho ultrapassa a duração do vídeo: '+c.name);return r;});
      return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Não foi possível abrir: '+c.name)),15000);r.onerror=()=>{clearTimeout(timer);reject(Error('Formato não reproduzível: '+c.name));};r.onload=()=>{clearTimeout(timer);resolve(r);};r.src=asset.url;});
    });
    Promise.all(loading).then(items=>{if(disposed)return;resources=items;ready=true;state.hidden=true;play.disabled=false;restart.disabled=false;slider.disabled=false;if(exportButton)exportButton.disabled=false;render();}).catch(error=>{if(!disposed){state.textContent=error.message;toast(error.message);}});
    return{pause,dispose(){disposed=true;pause();resources.forEach(r=>{r.removeAttribute('src');if(r.tagName==='VIDEO')r.load();});},get recording(){return recording;}};
  }
};
