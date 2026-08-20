import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

/* ---------- Scena / camera / renderer ---------- */
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x090d12);
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.01,10000);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.querySelector('#app').appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true; controls.dampingFactor=.08;
controls.zoomToCursor=true; // la rotella zooma verso il punto puntato dal mouse, non verso il centro fisso del modello

/* ---------- Ambiente PBR: riflessi realistici senza asset esterni ---------- */
const pmrem=new THREE.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;
pmrem.dispose();

/* ---------- Luci ---------- */
scene.add(new THREE.HemisphereLight(0xb8d7ff,0x20252d,1.4));
const light=new THREE.DirectionalLight(0xffffff,2.6);
light.castShadow=true; light.shadow.mapSize.set(2048,2048); light.shadow.bias=-.0005;
scene.add(light);
const rim=new THREE.DirectionalLight(0x6ea8ff,1.1); scene.add(rim);
const fill=new THREE.DirectionalLight(0xffe8c2,.35); scene.add(fill);

/* ---------- Post-processing: bloom leggero per i LED RGB del modello ---------- */
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.4,.5,.88);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const root=new THREE.Group(); scene.add(root);
const ray=new THREE.Raycaster(), mouse=new THREE.Vector2(), labels=[];
const parts={}; // nome -> Object3D (figlio diretto di RootNode nel GLB)

/* ---------- Etichetta 3D sempre rivolta verso la camera ---------- */
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function label(g,text,x,y,z,s){
  const pad=16,font=32,c=document.createElement('canvas'),ctx=c.getContext('2d');
  ctx.font=`600 ${font}px Arial`; const w=Math.ceil(ctx.measureText(text).width)+pad*2, h=font+pad*1.6;
  c.width=w; c.height=h; const ctx2=c.getContext('2d'); ctx2.font=`600 ${font}px Arial`;
  ctx2.fillStyle='rgba(9,13,19,.85)'; roundRect(ctx2,1,1,w-2,h-2,10); ctx2.fill();
  ctx2.strokeStyle='rgba(126,178,255,.7)'; ctx2.lineWidth=2; roundRect(ctx2,1,1,w-2,h-2,10); ctx2.stroke();
  ctx2.fillStyle='#eef6ff'; ctx2.textBaseline='middle'; ctx2.fillText(text,pad,h/2+1);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:true,transparent:true}));
  spr.scale.set(w*s,h*s,1); spr.position.set(x,y,z); spr.visible=false; // visibili solo in modalità esplosa (impostato da state())
  g.add(spr); labels.push({sprite:spr,w:w*s,h:h*s}); return spr;
}

/* ---------- Nomi/descrizioni in italiano per i nodi del modello "Dream Computer Setup" (Daniel Cardona, CC BY 4.0) ---------- */
const NAMES={
  MotherBoard:['Motherboard','Il circuito centrale del PC: collega CPU, RAM, GPU, storage e alimentazione e permette a tutti i componenti di comunicare tra loro.'],
  CPU:['CPU','Il "cervello" del computer: esegue le istruzioni dei programmi miliardi di volte al secondo. Più núclei e frequenza alta significano più potenza di calcolo.'],
  M2:['SSD M.2','Unità a stato solido collegata direttamente alla scheda madre: comunica via NVMe, un bus molto più veloce del SATA tradizionale.'],
  Case:['Case','Il telaio che ospita e protegge tutti i componenti, ne organizza il flusso d\'aria e fornisce i punti di fissaggio.'],
  RTX2080ti:['GPU · RTX 2080 Ti','La scheda video: un processore specializzato in calcoli paralleli, usato per la grafica 3D dei giochi ma anche per l\'intelligenza artificiale. Ha una memoria dedicata, la VRAM.'],
  Radiator:['Radiatore','Parte del raffreddamento a liquido: il liquido caldo che arriva dalla CPU cede calore alle alette metalliche, che le ventole disperdono poi nell\'aria.'],
  RAM:['RAM','Memoria ad accesso rapido dove il PC tiene i dati in uso al momento: a differenza dello storage è volatile, si svuota quando il PC si spegne.'],
  RAM1:['RAM','Memoria ad accesso rapido dove il PC tiene i dati in uso al momento: a differenza dello storage è volatile, si svuota quando il PC si spegne.'],
  RAM2:['RAM','Memoria ad accesso rapido dove il PC tiene i dati in uso al momento: a differenza dello storage è volatile, si svuota quando il PC si spegne.'],
  RAM3:['RAM','Memoria ad accesso rapido dove il PC tiene i dati in uso al momento: a differenza dello storage è volatile, si svuota quando il PC si spegne.'],
  SSD:['SSD SATA','Unità di archiviazione a stato solido: nessuna parte meccanica in movimento, quindi più veloce e silenziosa di un disco rigido, anche se meno rapida di un SSD M.2.'],
  Corsair_Fan:['Ventola radiatore','Spinge aria attraverso il radiatore per raffreddarne il liquido: nei sistemi AIO se ne usano tipicamente più di una insieme.'],
  Corsair_Fan1:['Ventola radiatore','Spinge aria attraverso il radiatore per raffreddarne il liquido: nei sistemi AIO se ne usano tipicamente più di una insieme.'],
  Corsair_Fan2:['Ventola radiatore','Spinge aria attraverso il radiatore per raffreddarne il liquido: nei sistemi AIO se ne usano tipicamente più di una insieme.'],
  WaterCooling:['Raffreddamento a liquido','Sistema AIO: una pompa fa circolare il liquido tra un blocco a contatto con la CPU e il radiatore, smaltendo il calore meglio di un dissipatore ad aria.'],
  PSU:['Alimentatore · PSU','Converte la corrente alternata della rete elettrica in corrente continua alle tensioni richieste da ogni componente, distribuendola tramite i cavi.'],
  GlassFront:['Vetro anteriore','Pannello del case.'],
  GlassTop:['Vetro superiore','Pannello del case.'],
  GlassSide:['Vetro laterale','Pannello del case.'],
};
const SKIP=/^imagePlane|^directionalLight/;
const HIDE_ON_EXPLODE=new Set(['Case','GlassFront','GlassTop','GlassSide']);
// Pezzi che si estraggono verticalmente (come nella realtà) invece che radialmente dal centro: altrimenti tagliano la motherboard.
const EXPLODE_UP=new Set(['RAM','RAM1','RAM2','RAM3']);
// Ventole del radiatore: si estraggono tutte nella STESSA direzione (non ognuna per conto suo dal centro del modello) così restano allineate tra loro come nella realtà.
const FAN_GROUP=['Corsair_Fan','Corsair_Fan1','Corsair_Fan2'];
const NO_LABEL=new Set(['GlassFront','GlassTop','GlassSide','RAM1','RAM2','RAM3','Corsair_Fan1','Corsair_Fan2']); // vetri non etichettati; un solo banco RAM e una sola ventola portano l'etichetta per il gruppo

let A={}, E={}, modelRadius=1, ready=false, exploded=false, anim=0, camAnim=0, modelCenter=new THREE.Vector3(), explodeDist=1, assembledDist=1;

/* ---------- Caricamento del modello ---------- */
const loader=new GLTFLoader();
loader.load(`${import.meta.env.BASE_URL}models/dream_computer_setup.glb`, gltf=>{
  root.add(gltf.scene);
  let rootNode=null;
  gltf.scene.traverse(o=>{ if(o.name==='RootNode') rootNode=o; if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } });
  if(!rootNode){ document.querySelector('#loading').textContent='Struttura del modello inattesa.'; return; }

  const fullBox=new THREE.Box3().setFromObject(gltf.scene);
  const fullSize=fullBox.getSize(new THREE.Vector3());
  modelRadius=Math.max(fullSize.x,fullSize.y,fullSize.z);

  for(const child of [...rootNode.children]){
    if(SKIP.test(child.name)) continue;
    const info=NAMES[child.name]||[child.name,''];
    child.userData.partName=child.name; child.userData.info=info;
    parts[child.name]=child;
    A[child.name]=child.position.clone();
    if(NOT_CLICKABLE.has(child.name)) child.traverse(m=>{ if(m.isMesh) m.raycast=()=>{}; }); // i vetri non intercettano il click: altrimenti bloccano la selezione di ciò che c'è dietro
  }

  const localCenter=new THREE.Vector3();
  Object.values(A).forEach(p=>localCenter.add(p));
  localCenter.multiplyScalar(1/Object.keys(A).length);

  const ramCenter=new THREE.Vector3();
  [...EXPLODE_UP].forEach(n=>{ if(A[n]) ramCenter.add(A[n]) }); ramCenter.multiplyScalar(1/EXPLODE_UP.size);

  // Direzione comune per tutte le ventole: dal radiatore verso la prima ventola (l'asse su cui sono montate), non dal centro del modello.
  let fanDir=new THREE.Vector3(0,0,1);
  if(A[FAN_GROUP[0]]&&A['Radiator']){ const d=A[FAN_GROUP[0]].clone().sub(A['Radiator']); if(d.lengthSq()>1e-6) fanDir=d.normalize(); }
  // Centro del gruppo ventole: serve per allargarne un po' la spaziatura reciproca (da montate a contatto, altrimenti restano quasi sovrapposte anche da esplose).
  const fanCenter=new THREE.Vector3();
  FAN_GROUP.forEach(n=>{ if(A[n]) fanCenter.add(A[n]) }); fanCenter.multiplyScalar(1/FAN_GROUP.length);

  // "destra/sinistra/su/giù" dello schermo nella vista di default, per poter spostare a mano alcuni pezzi esplosi senza che si sovrappongano ad altri.
  const camDir0=new THREE.Vector3(.85,.5,1.05).normalize().negate();
  const worldUp=new THREE.Vector3(0,1,0);
  const right0=new THREE.Vector3().crossVectors(camDir0,worldUp).normalize();
  const up0=new THREE.Vector3().crossVectors(right0,camDir0).normalize();

  for(const name of Object.keys(parts)){
    let E_pos;
    if(EXPLODE_UP.has(name)){
      // una RAM si estrae dritta verso l'alto (come nella realtà, non in diagonale attraverso la scheda madre); i 4 banchi vengono anche separati lateralmente così le etichette non si sovrappongono.
      const spread=A[name].clone().sub(ramCenter).multiplyScalar(2);
      E_pos=A[name].clone().add(new THREE.Vector3(0,modelRadius*.38,0)).add(spread);
    } else if(FAN_GROUP.includes(name)){
      const fanSpread=A[name].clone().sub(fanCenter).multiplyScalar(1.8); // allarga il distanziamento reciproco lungo lo stesso asse, restando allineate
      E_pos=A[name].clone().add(fanDir.clone().multiplyScalar(modelRadius*.4)).add(fanSpread);
    } else {
      const dir=A[name].clone().sub(localCenter);
      if(dir.lengthSq()<1e-6) dir.set(Math.random()-.5,Math.random()-.5,Math.random()-.5);
      dir.normalize();
      E_pos=A[name].clone().add(dir.multiplyScalar(modelRadius*.4));
    }
    if(EXPLODE_UP.has(name)) E_pos.add(right0.clone().multiplyScalar(modelRadius*.22)).add(up0.clone().multiplyScalar(-modelRadius*.1)); // RAM: più a destra e un po' più in basso
    if(name==='PSU') E_pos.add(right0.clone().multiplyScalar(-modelRadius*.4)).add(up0.clone().multiplyScalar(modelRadius*.6)); // alimentatore: più a sinistra e più in alto
    E[name]=E_pos;

    if(NO_LABEL.has(name)) continue;
    // Etichetta ancorata al centro-alto REALE della geometria in coordinate mondo, poi convertita nello spazio locale del pezzo con worldToLocal:
    // un offset locale fisso (0,y,0) presume un pivot centrato, falso per pezzi come PSU/SSD il cui pivot non coincide col centro della mesh.
    const box=new THREE.Box3().setFromObject(parts[name]);
    const worldTop=new THREE.Vector3((box.max.x+box.min.x)/2, box.max.y+modelRadius*.02, (box.max.z+box.min.z)/2);
    const localPos=parts[name].worldToLocal(worldTop);
    label(parts[name], NAMES[name]?NAMES[name][0]:name, localPos.x, localPos.y, localPos.z, modelRadius*.00035);
  }

  scene.fog=new THREE.Fog(0x090d12, modelRadius*2.2, modelRadius*9);

  const c=fullBox.getCenter(new THREE.Vector3()); modelCenter.copy(c);
  light.position.set(c.x+modelRadius,c.y+modelRadius*1.3,c.z+modelRadius);
  Object.assign(light.shadow.camera,{near:.1,far:modelRadius*4,left:-modelRadius,right:modelRadius,top:modelRadius,bottom:-modelRadius});
  light.shadow.camera.updateProjectionMatrix();
  rim.position.set(c.x-modelRadius,c.y+modelRadius*.6,c.z-modelRadius*.8);
  fill.position.set(c.x-modelRadius*.4,c.y+modelRadius*.25,c.z+modelRadius*1.2);

  camera.position.set(c.x+modelRadius*.85,c.y+modelRadius*.5,c.z+modelRadius*1.05);
  camera.near=modelRadius*.01; camera.far=modelRadius*20; camera.updateProjectionMatrix();
  controls.target.copy(c); controls.minDistance=modelRadius*.25; controls.maxDistance=modelRadius*4; controls.update();

  // Distanza necessaria per inquadrare tutta l'esplosione (i pezzi come RAM e PSU altrimenti finiscono fuori dalla vista): il più lontano dal centro, più un margine.
  let maxSpread=0; for(const n of Object.keys(parts)) maxSpread=Math.max(maxSpread,E[n].distanceTo(c));
  explodeDist=maxSpread+modelRadius*.35;
  assembledDist=camera.position.distanceTo(c);

  ready=true;
  document.querySelectorAll('#hud button').forEach(b=>b.disabled=false);
  document.querySelector('#mode').textContent='Modalità assemblata';
  document.querySelector('#loading').classList.add('hidden');
},
xhr=>{ if(xhr.total) document.querySelector('#loading').textContent=`Caricamento modello… ${Math.round(xhr.loaded/xhr.total*100)}%`; },
err=>{ document.querySelector('#loading').textContent='Errore nel caricamento del modello 3D.'; console.error(err); });

/* ---------- Esplodi / riassembla ---------- */
function state(next){
  if(!ready) return;
  const T=next?E:A, S={};
  for(const n of Object.keys(parts)) S[n]=parts[n].position.clone();

  // Se esplodendo la camera è troppo vicina per inquadrare tutti i pezzi (es. RAM in alto, PSU in basso), la allontana lungo la stessa direzione di vista attuale.
  const curDist=camera.position.distanceTo(controls.target);
  const targetDist=next?Math.max(curDist,explodeDist):curDist;
  const camDir=camera.position.clone().sub(controls.target).normalize();
  const camFrom=camera.position.clone();
  const camTo=controls.target.clone().add(camDir.multiplyScalar(targetDist));

  const t0=performance.now(); cancelAnimationFrame(anim);
  const f=now=>{
    const q=Math.min(1,(now-t0)/800), t=q<.5?2*q*q:1-Math.pow(-2*q+2,2)/2;
    for(const n of Object.keys(parts)) parts[n].position.lerpVectors(S[n],new THREE.Vector3(...T[n]),t);
    camera.position.lerpVectors(camFrom,camTo,t);
    if(q<1) anim=requestAnimationFrame(f);
  };
  anim=requestAnimationFrame(f);
  exploded=next;
  for(const n of HIDE_ON_EXPLODE) if(parts[n]) parts[n].visible=!next;
  for(const l of labels) l.sprite.visible=next; // le etichette hanno senso solo a pezzi separati: da assemblato molti sono nascosti dentro il case e la targhetta punterebbe al nulla
  document.querySelector('#mode').textContent=next?'Modalità esplosa':'Modalità assemblata';
  document.querySelector('#explode').textContent=next?'Riassembla':'Esplodi';
}
document.querySelector('#explode').onclick=()=>state(!exploded);

/* ---------- Selezione componente (solo per vederne il nome/funzione) ---------- */
const NOT_CLICKABLE=new Set(['GlassFront','GlassTop','GlassSide','Case']); // vetri e guscio del case non si selezionano: la loro geometria avvolge/sovrasta gli altri pezzi e ne intercetterebbe il click
function findPart(o){ while(o){ if(o.userData.partName&&!NOT_CLICKABLE.has(o.userData.partName)) return o; o=o.parent; } return null; }
renderer.domElement.addEventListener('pointerdown',e=>{
  if(!ready) return;
  mouse.x=e.clientX/innerWidth*2-1; mouse.y=-(e.clientY/innerHeight)*2+1; ray.setFromCamera(mouse,camera);
  const hit=ray.intersectObjects(root.children,true)[0]; if(!hit) return;
  const o=findPart(hit.object); if(!o) return;
  document.querySelector('#componentName').textContent=o.userData.info[0];
  document.querySelector('#componentInfo').textContent=o.userData.info[1];
});
renderer.domElement.addEventListener('pointermove',e=>{
  if(!ready) return;
  mouse.x=e.clientX/innerWidth*2-1; mouse.y=-(e.clientY/innerHeight)*2+1; ray.setFromCamera(mouse,camera);
  const hit=ray.intersectObjects(root.children,true)[0];
  renderer.domElement.style.cursor=(hit&&findPart(hit.object))?'pointer':'grab';
});

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight)});

const clock=new THREE.Clock(), tmpV=new THREE.Vector3();
(function loop(){
  requestAnimationFrame(loop);
  clock.getDelta();
  controls.update();
  for(const l of labels){ const d=camera.position.distanceTo(l.sprite.getWorldPosition(tmpV)), s=THREE.MathUtils.clamp(d/(modelRadius*1.1),.5,2.4); l.sprite.scale.set(l.w*s,l.h*s,1); }
  composer.render();
})();
