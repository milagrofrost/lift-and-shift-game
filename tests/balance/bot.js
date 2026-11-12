// Balance bot for Lift & Shift: plays whole careers by itself so two versions of the game can be compared.
// CI runs it through tests/balance/run.mjs (main against a pull request, same seeds). By hand, load it from any page
// on the same origin as lift-and-shift.html, then:
//   const r = await simBatch({diff:"normal", skill:"average", seeds:[1,2,3], maxClients:5}); simSummary(r)
// Each career runs in a hidden iframe with a seeded Math.random and a fixed 0.05 s step. Nothing is drawn; sound is off.
// Options: src (the game's HTML as text; default fetches /lift-and-shift.html), patch [[from,to]] (what-if tuning
// without editing the game), pri (shop order), preset + handsOff (AI-only runs), over (skill overrides).
// It plays worse than a good human (no restores or pickups) and results are noisy: compare versions with 30+ seeds;
// never use it to judge whether a difficulty is winnable. If the game's last line changes, update HOOK here too.
(()=>{
const HOOK='newRun();titleScreen();requestAnimationFrame(frame);';
const EXPOSE='window.__G={S:()=>S,keys,update,tickCelebration,successChance,useFreeze,grab:()=>{grabPressed=true},mode:()=>mode,setDiff:d=>{DIFF=d},ticketLimit,inboxLimit,importantMail,fixCost,devSet,lvl,capNext,clientStars,agentOdds};AU.on=false;MUS.on=false;newRun();titleScreen();';
const SKILL={
  expert:{retarget:0.25,patchAt:0.4,tkSlack:1,emSlack:1,leakAt:35,minOdds:0.6,retryMin:0.5,discoverEarly:false,shop:"plan",dodge:1.6,rush:3},
  average:{retarget:0.45,patchAt:0.35,tkSlack:1,emSlack:1,leakAt:45,minOdds:0.45,retryMin:0.4,discoverEarly:false,shop:"plan",dodge:0.8,rush:2},
  // the designer's own routine: discover everything, patch everything up front, then a few moves, then the queues, then a rhythm
  seasoned:{retarget:0.25,patchAt:0.55,tkSlack:1,emSlack:1,leakAt:30,minOdds:0.6,retryMin:0.5,discoverEarly:true,discoverFirst:true,openT:40,shop:"plan",dodge:1.6,rush:3},
  novice:{retarget:0.7,patchAt:0.28,tkSlack:0,emSlack:0,leakAt:60,minOdds:0.3,retryMin:0.3,discoverEarly:false,shop:"random",dodge:0,rush:1},
};
const PRI=["patchbot","runbooks","terraform","bluegreen","pipeline","statuspage","manager","pac","observe","oncall","autopatch","postmortem","scanner","agent","iam","siem","secrets","suppress","portal","moverbot","finops","inventory","spin","snacks","vendor","coffee","chatbot","freezecharge"];
const rng=n=>{let t=n>>>0;return()=>{t+=0x6D2B79F5;let r=Math.imul(t^t>>>15,1|t);r^=r+Math.imul(r^r>>>7,61|r);return((r^r>>>14)>>>0)/4294967296;};};
const tick=()=>new Promise(r=>{const c=new MessageChannel();c.port1.onmessage=()=>r();c.port2.postMessage(0);});
let SRC=null;
async function career({diff="normal",skill="expert",seed=1,maxClients=8,preset=null,handsOff=false,patch=null,pri=null,over=null,src:game=null}){
  if(!game&&!SRC)SRC=await (await fetch("/lift-and-shift.html",{cache:"no-store"})).text();
  const GAME=game||SRC;
  if(!GAME.includes(HOOK))throw new Error("hook not found");
  const f=document.createElement("iframe");f.style.cssText="position:absolute;left:-9999px;width:960px;height:600px;border:0";document.body.appendChild(f);
  const W=f.contentWindow;W.document.open();let src=GAME.replace(HOOK,EXPOSE);
  // Mr Paperclip's own generator is seeded from the clock; his lines give energy, so seed him from the career instead
  // or a career that buys him plays out differently every run
  src=src.replace(/let clipSeed=\(Date\.now\(\)>>>0\)\|\|7;/,`let clipSeed=${(seed*2654435761)>>>0}||7;`);for(const[a,b]of patch||[]){if(!src.includes(a))throw new Error("patch target not found: "+a);src=src.split(a).join(b);}W.document.write(src);W.document.close();
  // the game's script waits for its stylesheets (Google Fonts), so give it real time to start
  for(let k=0;k<400&&!W.__G;k++)await new Promise(r=>setTimeout(r,25));
  if(!W.__G){f.remove();throw new Error("the game did not start in the bot's frame");}
  const G=W.__G,P={...SKILL[skill],...(over||{})},ORDER=pri||PRI,rnd=rng(seed*7919+13);W.Math.random=rnd;
  G.setDiff(diff);W.document.querySelector('[data-act=start]').click();
  const K=G.keys;let S=G.S();
  if(preset)preset(G,S);
  const RX=i=>72+(i%3)*105,RY=i=>100+Math.floor(i/3)*116,SX=i=>652+(i%4)*80,SY=i=>100+Math.floor(i/4)*116,zone=x=>x<360?0:x<600?1:2;
  const out={diff,skill,seed,clients:[],end:null};
  let cs=null;const newCs=()=>({minUp:1,minSec:100,eLow:0,alertSec:0,downSec:0,cost0:{...S.cost},carry:0});
  const resetKeys=()=>{K.u=K.d=K.l=K.r=K.fix=K.grab=false;};
  function steer(tx,ty){const p=S.p;let gx=tx,gy=ty;const z=zone(p.x),tz=zone(tx);
    if(z!==tz){const dir=tz>z?1:-1,bx=dir>0?(z===0?360:600):(z===2?600:360);if(p.y>230&&p.y<330){gx=bx+dir*45;gy=p.y;}else{gx=bx-dir*32;gy=280;}}
    let dx=gx-p.x,dy=gy-p.y;const dd=Math.hypot(dx,dy)||1,far=Math.hypot(tx-p.x,ty-p.y);
    // step around people in the hallway, the way a player would (not while a donut or a freeze makes them harmless)
    if(P.dodge&&far>40&&!(p.ghost>0)&&!(p.userImm>0)&&!(S.freezeT>0)){let rx=0,ry=0;for(const u of S.users){if(u.chat||u.mgrChat||u.cd>0||!(S.pizza&&!u.hunter?false:true))continue;const d=Math.hypot(p.x-u.x,p.y-u.y);if(d<70&&d>0){const k=(70-d)/70*P.dodge;rx+=(p.x-u.x)/d*k;ry+=(p.y-u.y)/d*k;}}
      if(rx||ry){dx=dx/dd+rx;dy=dy/dd+ry;const m=Math.hypot(dx,dy)||1;dx=dx/m*10;dy=dy/m*10;}}
    K.l=dx<-3;K.r=dx>3;K.u=dy<-3;K.d=dy>3;return far;}
  function pick(){
    const racks=S.racks.map((a,i)=>a&&{a,i}).filter(Boolean),cloud=S.cloud.map((a,i)=>a&&{a,i}).filter(Boolean);
    const R=o=>({x:RX(o.i),y:RY(o.i)+42}),C=o=>({x:SX(o.i),y:SY(o.i)+38});
    if(S.carry){let bi=-1,bd=1e9;S.cloud.forEach((x,i)=>{if(x)return;const d=Math.hypot(SX(i)-S.p.x,SY(i)-S.p.y);if(d<bd){bd=d;bi=i;}});
      if(bi<0)return null;return{pri:9,kind:"drop",x:SX(bi),y:SY(bi)};}
    let c=cloud.find(o=>o.a.breach&&!o.a.down);if(c)return{pri:8,kind:"hold",...C(c)};
    c=racks.find(o=>o.a.down&&o.a.tier==="gold"&&!o.a.hidden);if(c)return{pri:8,kind:"hold",...R(c)};
    c=cloud.find(o=>o.a.down&&o.a.tier==="gold");if(c)return{pri:8,kind:G.successChance("gold")<P.retryMin?"rollback":"hold",...C(c)};
    if(S.alert)return null;
    c=cloud.find(o=>o.a.down);if(c)return{pri:7,kind:G.successChance(c.a.tier)<P.retryMin?"rollback":"hold",...C(c)};
    c=racks.find(o=>o.a.down);if(c)return{pri:6,kind:"hold",...R(c)};
    c=racks.filter(o=>o.a.fire>0&&!o.a.hidden).sort((p,q)=>q.a.fire-p.a.fire)[0];if(c)return{pri:6,kind:"hold",...R(c)};
    const left=racks.length+S.wave.length;
    if(left<=P.rush&&!S.frozen&&S.cloud.some(x=>!x)){const mv=racks.filter(o=>!o.a.hidden&&!o.a.down&&o.a.fire===0&&!S.pipe.some(j=>j.a===o.a)&&!S.cloud.some(x=>x&&x.staged&&x.orig===o.a)).map(o=>({...o,p:G.successChance(o.a.tier)})).sort((p,q)=>q.p-p.p)[0];
      if(mv&&mv.p>=P.minOdds)return{pri:5,kind:"grab",...R(mv),a:mv.a};}
    if(S.tk.length>=G.ticketLimit()-P.tkSlack&&S.energy>=3)return{pri:5,kind:"hold",x:480,y:470,q:"tk"};
    if(G.importantMail().length>=G.inboxLimit()-P.emSlack)return{pri:5,kind:"hold",x:480,y:96,q:"em"};
    c=cloud.filter(o=>o.a.leakOn&&o.a.leak>P.leakAt).sort((p,q)=>q.a.leak-p.a.leak)[0];if(c&&S.energy>=13)return{pri:4,kind:"hold",...C(c)};
    const pc=G.fixCost({kind:"patch"}),opening=S.time<(P.openT||0);
    if(opening&&P.discoverFirst){const h0=racks.find(o=>o.a.hidden);if(h0)return{pri:4,kind:"hold",...R(h0)};}
    c=racks.filter(o=>!o.a.hidden&&!o.a.down&&o.a.fire===0&&(!o.a.covered||o.a.botErr)&&o.a.timer<o.a.maxT*(opening?1.01:P.patchAt)).sort((p,q)=>p.a.timer-q.a.timer)[0];
    if(c&&S.energy>=pc)return{pri:3,kind:"hold",...R(c)};
    c=cloud.find(o=>o.a.staged&&!o.a.orig.down);if(c)return{pri:2,kind:"hold",...C(c)};
    const hid=racks.find(o=>o.a.hidden);
    if(hid&&P.discoverEarly)return{pri:2,kind:"hold",...R(hid)};
    if(!S.frozen&&S.cloud.some(x=>!x)){
      const busy=a=>S.cloud.some(x=>x&&x.staged&&x.orig===a)||S.pipe.some(j=>j.a===a)||S.bots.some(b=>b.carry===a);
      const mv=racks.filter(o=>!o.a.hidden&&!o.a.down&&o.a.fire===0&&!busy(o.a)).map(o=>({...o,p:G.successChance(o.a.tier)})).sort((p,q)=>q.p-p.p||p.a.timer-q.a.timer)[0];
      if(mv&&(mv.p>=P.minOdds||!hid))return{pri:1,kind:"grab",...R(mv),a:mv.a};
    }
    if(hid)return{pri:1,kind:"hold",...R(hid)};
    c=cloud.find(o=>o.a.rsTag);if(c)return{pri:0,kind:"hold",...C(c)};
    if(S.tk.length&&S.energy>=20)return{pri:0,kind:"hold",x:480,y:470};
    if(G.importantMail().length)return{pri:0,kind:"hold",x:480,y:96};
    return null;
  }
  function shop(){
    const d=W.document;let r=[...d.querySelectorAll("[data-retro]")];
    if(r.length){const br=r.find(b=>b.dataset.retro==="break");(br&&skill!=="expert"?br:r[0]).click();}
    for(let guard=0;guard<40;guard++){
      const btns=[...d.querySelectorAll("[data-buy]")].filter(b=>!b.disabled);if(!btns.length)break;
      let b;if(P.shop==="random")b=btns[Math.floor(rnd()*btns.length)];
      else b=btns.sort((x,y)=>(ORDER.indexOf(x.dataset.buy)+99)%99-(ORDER.indexOf(y.dataset.buy)+99)%99)[0];
      b.click();
    }
  }
  let tgt=null,retarget=0,steps=0,cSteps=0;cs=newCs();
  for(;;){
    const md=G.mode();
    if(md==="play"){
      S=G.S();cSteps++;
      cs.minUp=Math.min(cs.minUp,S.err/S.errMax);cs.minSec=Math.min(cs.minSec,S.security);
      if(S.energy<12)cs.eLow+=0.05;if(S.alert)cs.alertSec+=0.05;if(S.frozen)cs.downSec+=0.05;if(S.carry)cs.carry+=0.05;
      resetKeys();
      if(!handsOff){
        if(S.alert&&S.upgrades.freezecharge&&!(S.freezeT>0))G.useFreeze();
        retarget-=0.05;if(tgt)tgt.age=(tgt.age||0)+0.05;
        if(tgt&&tgt.q&&!S.alert&&!S.frozen&&!S.racks.some(a=>a&&a.fire>0)&&(tgt.q==="tk"?S.tk.length&&S.energy>=3:G.importantMail().length)&&tgt.age<9){retarget=P.retarget;}
        else if(retarget<=0||!tgt){retarget=P.retarget;const cand=pick();
          if(!tgt||!cand||cand.pri>tgt.pri||tgt.age>7||(Math.abs(cand.x-tgt.x)<2&&Math.abs(cand.y-tgt.y)<2))tgt=cand;}
        if(tgt){const d=steer(tgt.x,tgt.y);
          // keep walking until the game itself says something is in reach (or we are right on the spot)
          if(tgt.kind==="hold"&&d<24&&d>=5&&!S.fix){/* keep steering */}
          else if(d<(tgt.kind==="drop"?8:tgt.kind==="grab"?10:24)){K.u=K.d=K.l=K.r=false;
            if(tgt.kind==="hold"){K.fix=!S.fixLock;if(!S.fix&&d<5){tgt.idle=(tgt.idle||0)+0.05;if(tgt.idle>0.5)tgt=null;}}
            else if(tgt.kind==="rollback"){K.grab=true;if(tgt.age>6)tgt=null;}
            else if(zone(S.p.x)===(tgt.kind==="drop"?2:0)){G.grab();tgt=null;}
          }}
      }
      G.update(0.05);steps++;
      if(cSteps>36000){out.end={stall:true,client:S.sprint,t:Math.round(S.time),racks:S.racks.filter(Boolean).length,wave:S.wave.length,tgt:tgt&&tgt.kind,alert:S.alert,frozen:S.frozen};break;}
    }else if(md==="celebrate"){G.tickCelebration(0.05);}
    else if(md==="review"){
      S=G.S();const last=S.career[S.career.length-1],ss=S.ss,dc={};
      for(const k in S.cost){const v=Math.round((S.cost[k]||0)-(cs.cost0[k]||0));if(v)dc[k]=v;}
      out.clients.push({n:S.sprint,name:last.name,brk:(S.breaks||[]).includes(S.sprint),stage:S.sprint-(S.breaks||[]).filter(b=>b<S.sprint).length,dur:Math.round(S.time),days:last.days,late:last.late,stars:last.stars,cap:last.cap,apps:S.totalApps,
        audits:ss.audits,breaches:ss.breaches,lost:ss.lost,esc:ss.esc,held:Math.round(ss.heldT),fails:ss.att-ss.mig,att:ss.att,missed:ss.missed,
        minUp:+cs.minUp.toFixed(2),minSec:Math.round(cs.minSec),eLow:Math.round(cs.eLow),alertSec:Math.round(cs.alertSec),downSec:Math.round(cs.downSec),spend:last.spend,cost:dc,
        acts:ss.acts,escA:ss.escA||0,aiL:S.upgrades.agent|0,aiTk:ss.aiTk||0,skilled:ss.acts?+((ss.acts-(ss.routine||0))/ss.acts).toFixed(2):null,outsourced:!!S.outsourced,menial:ss.menial||0,k:ss.k,ai:ss.ai.n,aiBad:ss.ai.bad,bot:ss.bot,obsolete:!!S.obsolete});
      if(S.career.length>=maxClients||S.obsolete||S.outsourced){out.end={retired:true,clients:S.career.length,obsolete:!!S.obsolete,outsourced:!!S.outsourced};break;}
      if(!preset)shop();
      out.clients[out.clients.length-1].ups=Object.entries(S.upgrades).filter(e=>e[1]).map(([k,v])=>v===true?k:k+v).join(",");
      W.document.querySelector('[data-act=next]').click();tgt=null;cSteps=0;S=G.S();if(preset)preset(G,S,true);cs=newCs();
    }else if(md==="end"){
      S=G.S();const h=W.document.querySelector(".card h2");
      out.end={fired:h?h.textContent:"?",client:S.sprint-(S.breaks||[]).filter(b=>b<S.sprint).length,brk:(S.breaks||[]).includes(S.sprint),t:Math.round(S.time),up:+(S.err/S.errMax).toFixed(2),sec:Math.round(S.security),secLoss:JSON.stringify(S.secLoss),audits:S.ss.audits,breaches:S.ss.breaches,lost:S.ss.lost,esc:S.ss.esc,eLow:Math.round(cs.eLow),apps:S.totalApps,left:S.racks.filter(Boolean).length+S.wave.length};
      break;
    }else{out.end={mode:md};break;}
    if(steps%1500===0)await tick();
  }
  out.budget=Math.round(G.S().budget);f.remove();
  return out;
}
window.simCareer=career;
window.simBatch=async function(o){
  const keep={};for(const k of["liftshift-best","liftshift-best-n","liftshift-clients"])keep[k]=localStorage.getItem(k);
  const res=[];
  try{for(const seed of o.seeds)res.push(await career({...o,seed}));}
  finally{for(const k in keep){if(keep[k]===null)localStorage.removeItem(k);else localStorage.setItem(k,keep[k]);}}
  return res;
};
// compact summary of a batch: how far careers got, why they ended, and per-client averages
window.simSummary=function(res){
  const avg=a=>a.length?+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2):null;
  const ends={};for(const r of res){const k=r.end.fired||(r.end.stall?"STALL":r.end.obsolete?"obsolete":r.end.outsourced?"outsourced":"survived");ends[k]=(ends[k]||0)+1;}
  const by={};for(const r of res)for(const c of r.clients){if(c.brk)continue;(by[c.stage]=by[c.stage]||[]).push(c);}
  const firedAt={};for(const r of res)if(r.end.fired)firedAt[r.end.client]=(firedAt[r.end.client]||0)+1;
  const rows=Object.keys(by).map(n=>{const l=by[n];return{n:+n,runs:l.length,apps:avg(l.map(c=>c.apps)),dur:avg(l.map(c=>c.dur)),late:avg(l.map(c=>c.late)),stars:avg(l.map(c=>c.stars)),cap:avg(l.map(c=>c.cap)),audits:avg(l.map(c=>c.audits)),breaches:avg(l.map(c=>c.breaches)),lost:avg(l.map(c=>c.lost)),esc:avg(l.map(c=>c.esc)),held:avg(l.map(c=>c.held)),fails:avg(l.map(c=>c.fails)),minUp:avg(l.map(c=>c.minUp)),minSec:avg(l.map(c=>c.minSec)),eLow:avg(l.map(c=>c.eLow)),spend:avg(l.map(c=>c.spend)),escA:avg(l.map(c=>c.escA)),aiL:avg(l.map(c=>c.aiL)),aiTk:avg(l.map(c=>c.aiTk)),aiCost:avg(l.map(c=>c.cost.ai||0)),skilled:avg(l.filter(c=>c.skilled!=null).map(c=>c.skilled)),ai:avg(l.map(c=>c.ai)),acts:avg(l.map(c=>c.acts)),bot:avg(l.map(c=>c.bot))};});
  return{n:res.length,ends,firedAt,breaks:res.reduce((n,r)=>n+r.clients.filter(c=>c.brk).length,0),avgClients:avg(res.map(r=>r.clients.length)),avgBudget:avg(res.map(r=>r.budget)),rows};
};
})();
