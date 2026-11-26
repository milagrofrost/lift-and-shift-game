// Set-up scenes shared by the phone and desktop tests. Each `build` runs inside the game page (as a string, so it
// can't close over anything here) with G = window.__G and the helpers in PRELUDE. It returns nothing; the spec
// then reads the page. `touch` is what FIX and GRAB should say on a touch screen ([word, lit]); null skips the check.
// `hint` is the floor hint over the player (WARN wording) on a keyboard and on a touch screen.
export const PRELUDE = `
  const seedS = n => __seed(n);
  const fresh = (o = {}) => {
    seedS(o.s || 1); G.setLogLv(1);
    G.newRun(); G.startSprint(o.sprint || 1); G.play();
    const S = G.S;
    S.users = []; S.cbots = []; S.atk = []; S.tk = []; S.em = []; S.st = []; S.sp = []; S.temp = null;
    S.racks.forEach(a => { if (!a) return; a.hidden = false; a.fire = 0; a.down = false; a.covered = false; a.timer = a.maxT; });
    document.getElementById('toasts').innerHTML = '';
    seedS((o.s || 1) + 1000);
    return S;
  };
  const stand = (S, p) => { S.p.x = p.x; S.p.y = p.y; };
  const known = S => S.racks.findIndex(a => a && !a.hidden);
  const emptySlot = S => S.cloud.findIndex(c => !c);
  const tick = () => G.update(0.001);
`;

export const SCENES = [
  {name: '01-menu', build: `G.setLogLv(1); G.titleScreen();`, mode: 'title'},
  {name: '02-tutorials', build: `G.setLogLv(1); G.titleScreen(); document.querySelector('[data-act=tut]').click();`},
  {name: '02b-welcome', build: `G.setLogLv(1); G.newRun(); G.titleScreen(); document.querySelector('[data-act=start]').click();`, mode: 'title'},
  {name: '03-start', build: `const S = fresh(); stand(S, {x: 480, y: 280}); tick();`, mode: 'play', touch: {fix: ['FIX', false], grab: ['GRAB', false]}},
  {name: '04-fire', build: `const S = fresh(); const i = known(S); S.racks[i].fire = 40; stand(S, G.RACKS[i]); tick();`,
    mode: 'play', touch: {fix: ['DOUSE', true], grab: [null, false]}, hint: {key: 'Hold E: extinguish', touch: 'Hold DOUSE: extinguish'}},
  {name: '05-tickets', build: `const S = fresh(); S.tk = [{age: 0}, {age: 0}, {age: 0}, {age: 0}];
    G.toast('🎫 A fairly long message about the ticket queue that would sit right over the desk on a small screen');
    stand(S, G.DESK); tick();`, mode: 'play', touch: {fix: ['REPLY', true], grab: null}, toastsTop: true,
    hint: {key: 'Hold E: tickets', touch: 'Hold REPLY: tickets'}},
  {name: '06-deploy', build: `const S = fresh(); S.upgrades.pipeline = 0; const i = known(S), a = S.racks[i]; S.racks[i] = null; S.carry = a;
    stand(S, G.SLOTS[emptySlot(S)]); tick();`, mode: 'play', touch: {fix: null, grab: ['DEPLOY', true]},
    hint: {key: /^Space: migrate \d+%$/, touch: /^DEPLOY: migrate \d+%$/}},
  {name: '07-rollback', build: `const S = fresh(); const i = known(S), a = S.racks[i], j = emptySlot(S); S.racks[i] = null;
    const r = Math.random; Math.random = () => 0.999; G.migrate(a, j, true, 0); Math.random = r;
    stand(S, G.SLOTS[j]); tick();`, mode: 'play', touch: {fix: ['RETRY', true], grab: ['ROLLBACK', true]},
    hint: {key: /^Hold Space: roll back  ·  Hold E: retry \d+%$/, touch: /^Hold ROLLBACK: roll back  ·  Hold RETRY \d+%$/}},
  {name: '08-red-alert', build: `const S = fresh(); const a = S.racks.find(a => a && a.tier === 'gold') || S.racks[known(S)]; a.tier = 'gold'; a.down = true;
    stand(S, {x: 480, y: 280}); tick();`, mode: 'play', alert: true},
  {name: '09-pause', build: `fresh(); G.togglePause();`, mode: 'paused'},
  {name: '10-review', build: `const S = fresh(); S.time = 95; S.ss.human = 1; S.ss.acts = 1; G.finishEngagement();`, mode: 'review'},
  {name: '11-debug', build: `const S = fresh(); S.racks[known(S)].fire = 30; S.tk = [{age: 0}, {age: 0}]; G.setLogLv(3);
    stand(S, {x: 480, y: 120}); for (let k = 0; k < 5; k++) G.update(0.05);`, mode: 'play'},
  {name: '12-end', build: `fresh(); G.showEnd('uptime');`, mode: 'end'},
  {name: '13-how-to-play', build: `G.setLogLv(1); G.titleScreen(); document.querySelector('[data-act=howto]').click();`},
  {name: '15-pipeline-jam', build: `const S = fresh(); S.upgrades.pipeline = 2; const i = known(S), a = S.racks[i]; S.racks[i] = null;
    S.pipe = [{a, t: 0, dur: 6, lane: 0, brk: 0.4}]; G.tickPipeline(5); document.getElementById('toasts').innerHTML = '';
    stand(S, {x: 480, y: 240}); tick();`, mode: 'play', touch: {fix: ['UNJAM', true], grab: null},
    hint: {key: 'Hold E: repair pipeline', touch: 'Hold UNJAM: repair pipeline'}},
  {name: '16-day2-handover', build: `seedS(5); G.setLogLv(1); G.D2.start(); G.D2.act('d2go'); const S = G.S; S.users = [];
    document.getElementById('toasts').innerHTML = ''; stand(S, {x: 426, y: 60}); tick();`, mode: 'play', touch: {fix: ['WRITE', true], grab: ['COACH', false]},
    hint: {key: 'Hold E: patching runbook', touch: 'Hold WRITE: patching runbook'}},
  {name: '17-day2-coach', build: `seedS(5); G.setLogLv(1); G.D2.start(); G.D2.act('d2go'); const S = G.S; S.users = [];
    S.d2.prog.sk.patch.xp = 20; document.getElementById('toasts').innerHTML = ''; const a = S.racks.find(Boolean); stand(S, {x: G.RACKS[a.slot].x, y: G.RACKS[a.slot].y + 44}); tick(); tick();`,
    mode: 'play', touch: {fix: ['PATCH', true], grab: ['COACH', true]}},
  {name: '18-day2-night', build: `seedS(5); G.setLogLv(1); G.D2.start(); G.D2.act('d2go'); G.D2.act('d2shift'); const S = G.S;
    S.d2.call = {t: {kind: 'ticket', a: null}, left: 6, ring: 1}; S.d2.temp.phone = true; document.getElementById('toasts').innerHTML = ''; tick();`,
    mode: 'play', touch: {fix: ['PICK UP', true], grab: ['PICK UP', true]}},
  {name: '19-day2-review', build: `seedS(5); G.setLogLv(1); G.D2.simulate({prog: {shift: 0}});`, mode: 'end'},
  {name: '14-hands-on', build: `G.setLogLv(1); G.titleScreen(); document.querySelector('[data-act=tut]').click(); document.querySelector('[data-act=handson]').click();`},
  // last, since it stays open over whatever comes next
  {name: '20-gitamp', build: `fresh(); G.togglePause(); G.devRun('gitamp'); G.GA.act('next');`, mode: 'paused'},
];

/** Build a scene in the page, render one frame, and return what the checks need. */
export async function buildScene(page, scene) {
  return page.evaluate(`(() => { const G = window.__G; ${PRELUDE}
    ${scene.build}
    G.hud(); G.draw();
    const ov = document.getElementById('overlay'), b = id => { const e = document.getElementById(id), r = e.getBoundingClientRect();
      return {text: e.textContent, ready: e.classList.contains('ready'), off: e.classList.contains('off'),
        visible: r.width > 0 && getComputedStyle(e).display !== 'none' && getComputedStyle(document.getElementById('touch')).display !== 'none' && !document.getElementById('touch').hidden,
        box: [r.x, r.y, r.width, r.height].map(Math.round)}; };
    const keyText = [G.S && G.S.prompt || '', ...[...document.querySelectorAll('#toasts .toast')].map(t => t.textContent), ov.hidden ? '' : ov.innerHTML].join(' | ');
    return {mode: G.mode, prompt: G.S && G.S.prompt, keyText, fix: b('t-fix'), grab: b('t-grab'), toastsTop: document.getElementById('toasts').classList.contains('top'),
      alert: document.querySelector('.stage').classList.contains('alert'),
      overlayOpen: !ov.hidden, overlayScroll: ov.hidden ? 0 : ov.scrollTop + (ov.firstElementChild ? ov.firstElementChild.scrollTop : 0),
      scrollW: document.documentElement.scrollWidth, innerW: innerWidth};
  })()`);
}
