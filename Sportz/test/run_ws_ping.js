import WebSocket from 'ws';

const url = process.env.WS_URL ?? 'ws://localhost:8000/ws';
const ws = new WebSocket(url);

ws.on('open', ()=>{
  console.log('ws open');
  for(let i=0;i<7;i++){
    const msg = {type:'ping', seq:i+1};
    console.log('send', msg);
    ws.send(JSON.stringify(msg));
  }
  setTimeout(()=>ws.close(), 500);
});

ws.on('message', (data)=>{
  try{ console.log('recv', data.toString()); } catch(e){ console.log('recv', data); }
});

ws.on('error', (e)=>{ console.error('ws error', e.message||e); process.exit(1) });
ws.on('close', (code,reason)=>{ console.log('ws closed', code, reason?.toString?.()); process.exit(0) });
