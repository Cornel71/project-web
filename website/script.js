document.getElementById('year').textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   STARFIELD BACKGROUND
   ============================================================ */
(function starfield(){
  const canvas = document.getElementById('starfield');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, stars, shootingStars = [];

  function sizeCanvas(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function makeStars(){
    const count = Math.floor((w * h) / 9000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.3 + 0.3,
      baseAlpha: Math.random() * 0.6 + 0.3,
      twinkleSpeed: Math.random() * 0.015 + 0.004,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function maybeSpawnShootingStar(){
    if(reduceMotion) return;
    if(Math.random() < 0.0025 && shootingStars.length < 2){
      const startX = Math.random() * w * 0.6;
      const startY = Math.random() * h * 0.4;
      shootingStars.push({
        x: startX, y: startY,
        vx: 6 + Math.random() * 4,
        vy: 3 + Math.random() * 2,
        life: 0,
        maxLife: 40 + Math.random() * 20,
      });
    }
  }

  function draw(){
    ctx.clearRect(0, 0, w, h);

    // static/twinkling stars
    for(const s of stars){
      let alpha = s.baseAlpha;
      if(!reduceMotion){
        s.phase += s.twinkleSpeed;
        alpha = s.baseAlpha * (0.6 + 0.4 * Math.sin(s.phase));
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(233, 237, 247, ${alpha.toFixed(2)})`;
      ctx.fill();
    }

    // shooting stars
    maybeSpawnShootingStar();
    shootingStars = shootingStars.filter(sh => sh.life < sh.maxLife);
    for(const sh of shootingStars){
      sh.x += sh.vx;
      sh.y += sh.vy;
      sh.life++;
      const alpha = 1 - sh.life / sh.maxLife;
      const grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 8, sh.y - sh.vy * 8);
      grad.addColorStop(0, `rgba(110,231,255,${alpha})`);
      grad.addColorStop(1, 'rgba(110,231,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(sh.x - sh.vx * 8, sh.y - sh.vy * 8);
      ctx.stroke();
    }

    if(!reduceMotion){
      requestAnimationFrame(draw);
    }
  }

  sizeCanvas();
  makeStars();
  draw();

  if(reduceMotion){
    // draw once more after a tick in case fonts shift layout
    setTimeout(draw, 300);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      sizeCanvas();
      makeStars();
      if(reduceMotion) draw();
    }, 150);
  });
})();

/* ============================================================
   TYPEWRITER ENGINE
   ============================================================ */
function typeInto(el, text, speed = 28){
  return new Promise(resolve => {
    if(reduceMotion){
      el.textContent = text;
      resolve();
      return;
    }
    el.textContent = '';
    el.classList.add('is-typing');
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.textContent = '\u2588';
    el.after(cursor);

    let i = 0;
    function step(){
      if(i <= text.length){
        el.textContent = text.slice(0, i);
        i++;
        setTimeout(step, speed + Math.random() * 22);
      } else {
        cursor.remove();
        el.classList.remove('is-typing');
        resolve();
      }
    }
    step();
  });
}

/* ---- hero sequence: eyebrow -> name -> subtitle -> terminal log ---- */
async function runHeroSequence(){
  const eyebrow = document.querySelector('.eyebrow[data-type]');
  const nameParts = document.querySelectorAll('h1 [data-type]');
  const sub = document.querySelector('.hero-sub[data-type]');

  if(eyebrow) await typeInto(eyebrow, eyebrow.dataset.text.replace(/&middot;/g, '\u00b7'), 22);
  for(const part of nameParts){
    await typeInto(part, part.dataset.text, 55);
  }
  if(sub) await typeInto(sub, sub.dataset.text, 14);

  runTerminalLog();
}

/* ---- terminal / mission log: lines appear + type sequentially ---- */
async function runTerminalLog(){
  const body = document.getElementById('terminalBody');
  if(!body) return;

  const lines = [
    { text: '$ kubectl get engineer cornel-mihai-badea -o wide', cls: '', speed: 16 },
    { text: 'NAME                     ROLE               STATUS     READY', cls: 'line-head', speed: 4, instant: true },
    { text: 'cornel-mihai-badea      devops-platform    Running    1/1', cls: '', speed: 4, instant: true, statusWord: 'Running' },
    { text: '', cls: '', speed: 0, instant: true },
    { text: '$ kubectl describe engineer cornel-mihai-badea | grep Focus', cls: '', speed: 16 },
    { text: 'Focus:  Kubernetes, ArgoCD, Terraform, CI/CD, Observability', cls: '', speed: 10 },
  ];

  for(const l of lines){
    const p = document.createElement('p');
    p.className = 'line' + (l.cls ? ' ' + l.cls : '');
    body.appendChild(p);

    if(!l.text){
      p.innerHTML = '&nbsp;';
      continue;
    }

    if(reduceMotion || l.instant){
      if(l.statusWord){
        p.innerHTML = l.text.replace(l.statusWord, `<span class="status-running">${l.statusWord}</span>`);
      } else {
        p.textContent = l.text;
      }
      if(!reduceMotion) await new Promise(r => setTimeout(r, 120));
      continue;
    }

    await typeInto(p, l.text, l.speed);
  }

  const cursorLine = document.createElement('p');
  cursorLine.className = 'line';
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  cursor.textContent = '\u2588';
  cursorLine.appendChild(cursor);
  body.appendChild(cursorLine);
}

/* ---- section headings: type once when scrolled into view ---- */
function setupScrollTypewriters(){
  const targets = document.querySelectorAll('[data-type-onview]');
  if(!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    for(const entry of entries){
      if(entry.isIntersecting){
        const el = entry.target;
        const text = el.dataset.text.replace(/&middot;/g, '\u00b7').replace(/&#39;/g, "'");
        typeInto(el, text, 20);
        observer.unobserve(el);
      }
    }
  }, { threshold: 0.4 });

  targets.forEach(t => observer.observe(t));
}

document.addEventListener('DOMContentLoaded', () => {
  runHeroSequence();
  setupScrollTypewriters();
});
