const $=s=>document.querySelector(s);
const home=$('#home'),camera=$('#camera'),video=$('#video'),canvas=$('#captureCanvas');
const statusEl=$('#status'),resultCard=$('#resultCard'),toast=$('#toast');
let stream=null,facing='environment',lastImage=null,lastResult=null;

function show(el){el.classList.add('active')};function hide(el){el.classList.remove('active')};
function toastMsg(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>toast.classList.remove('show'),2600)}

async function startCamera(){
  if(!navigator.mediaDevices?.getUserMedia){toastMsg('Camera is not supported in this browser.');return}
  try{
    if(stream) stream.getTracks().forEach(t=>t.stop());
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1280},height:{ideal:720}},audio:false});
    video.srcObject=stream;await video.play();hide(home);show(camera);statusEl.textContent='Point your camera at something interesting.';
  }catch(e){console.error(e);toastMsg(e.name==='NotAllowedError'?'Camera permission was denied.':'Could not start the camera.');}
}
function stopCamera(){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;hide(camera);show(home);resultCard.classList.add('hidden')}
function captureVideo(){
  if(!video.videoWidth){toastMsg('Camera is not ready yet.');return null}
  const max=1280,scale=Math.min(1,max/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);
  const ctx=canvas.getContext('2d');ctx.drawImage(video,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.82)
}
async function analyze(image){
  lastImage=image;statusEl.textContent='AI is looking at what you see…';
  $('#captureBtn').disabled=true;
  try{
    const res=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image})});
    if(!res.ok) throw new Error(await res.text());
    const data=await res.json();renderResult(data);statusEl.textContent='Object recognized. Explore the AR card.';
  }catch(e){
    console.error(e);
    // Demo fallback keeps the camera experience useful before a server key is configured.
    renderResult({title:'Something in view',description:'Connect the AI endpoint to identify objects in real time. The camera and AR overlay are working.',icon:'✦',confidence:'DEMO',facts:['AI Vision ready','Camera connected']});
    statusEl.textContent='AI endpoint is not configured yet.';
    toastMsg('AI endpoint unavailable — showing demo result.');
  }finally{$('#captureBtn').disabled=false}
}
function renderResult(data){
  lastResult=data;$('#resultTitle').textContent=data.title||'I see something';$('#resultDescription').textContent=data.description||'';$('#resultIcon').textContent=data.icon||'✦';$('#confidence').textContent=data.confidence?`${data.confidence} CONFIDENCE`:'AI VISION';
  const facts=$('#resultFacts');facts.innerHTML='';(data.facts||[]).slice(0,5).forEach(f=>{const s=document.createElement('span');s.textContent=f;facts.appendChild(s)});resultCard.classList.remove('hidden');
}
async function askQuestion(){
  const q=$('#questionInput').value.trim();if(!q||!lastImage){return}
  const answer=$('#answer');answer.classList.remove('hidden');answer.textContent='Thinking…';
  try{const res=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:lastImage,question:q,context:lastResult})});if(!res.ok)throw new Error(await res.text());const d=await res.json();answer.textContent=d.answer||d.description||'I could not answer that.'}
  catch(e){answer.textContent='The AI question service is not configured yet. Add OPENAI_API_KEY to the server environment and try again.'}
}

$('#startBtn').addEventListener('click',startCamera);$('#closeBtn').addEventListener('click',stopCamera);
$('#switchBtn').addEventListener('click',()=>{facing=facing==='environment'?'user':'environment';startCamera()});
$('#captureBtn').addEventListener('click',()=>{const img=captureVideo();if(img)analyze(img)});
$('#galleryBtn').addEventListener('click',()=>$('#fileInput').click());
$('#fileInput').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>analyze(reader.result);reader.readAsDataURL(file)});
$('#dismissResult').addEventListener('click',()=>resultCard.classList.add('hidden'));
$('#askBtn').addEventListener('click',()=>{$('#askContext').textContent=lastResult?`Ask anything about ${lastResult.title||'what I see'}.`:'Ask a question about the object.';$('#askPanel').classList.add('open');$('#questionInput').focus()});
$('#closeAsk').addEventListener('click',()=>$('#askPanel').classList.remove('open'));$('#sendQuestion').addEventListener('click',askQuestion);$('#questionInput').addEventListener('keydown',e=>{if(e.key==='Enter')askQuestion()});
$('#shareBtn').addEventListener('click',async()=>{const url=location.href;if(navigator.share){try{await navigator.share({title:'I See What You See AR',text:'Try this AI-powered WebAR experience',url})}catch{}}else{await navigator.clipboard?.writeText(url);toastMsg('Link copied.')}});
window.addEventListener('pagehide',()=>stream?.getTracks().forEach(t=>t.stop()));
