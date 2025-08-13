// Estado
let participantes = [];
let sorteados = [];
let rotacaoDeg = 0;
let girando = false;

// DOM
const $nome = document.getElementById('nome');
const $btnAdd = document.getElementById('btn-add');
const $btnSpin = document.getElementById('btn-spin');
const $btnClear = document.getElementById('btn-clear');
const $lista = document.getElementById('lista');
const $sorteados = document.getElementById('sorteados');
const $resultado = document.getElementById('resultado');
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
const cx = W / 2;
const cy = H / 2;
const R = Math.min(W, H) * 0.5 - 8;

// Overlay
const overlay = document.getElementById('overlay');
const winnerNameEl = document.getElementById('winner-name');
const overlayClose = document.getElementById('overlay-close');

// Abas
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// Funções
function corSetor(i, n){
  const h = Math.round((360 / Math.max(n,1)) * i);
  return `hsl(${h} 75% 55%)`;
}

function desenhar(){
  ctx.clearRect(0,0,W,H);
  const n = participantes.length;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI*2);
  ctx.fillStyle = '#1b1c28';
  ctx.fill();

  if(n === 0){
    ctx.fillStyle = '#b7b9c9';
    ctx.font = '500 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Adicione participantes para gerar a roleta', cx, cy);
    return;
  }

  const angSetor = 360 / n;
  for(let i=0;i<n;i++){
    const inicioTop = (rotacaoDeg + i * angSetor) % 360;
    const fimTop = (rotacaoDeg + (i+1) * angSetor) % 360;
    const a0 = ((inicioTop - 90) * Math.PI) / 180;
    const a1 = ((fimTop - 90) * Math.PI) / 180;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, a0, a1);
    ctx.closePath();
    ctx.fillStyle = corSetor(i, n);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const meioTop = (rotacaoDeg + (i + 0.5) * angSetor) % 360;
    const meioCanvas = ((meioTop - 90) * Math.PI) / 180;
    const rTexto = R * 0.65;
    const tx = cx + rTexto * Math.cos(meioCanvas);
    const ty = cy + rTexto * Math.sin(meioCanvas);

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(meioCanvas + Math.PI/2);
    ctx.fillStyle = '#fff';
    ctx.font = '600 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = participantes[i];
    const maxChars = 14;
    const texto = label.length > maxChars ? (label.slice(0, maxChars-1) + '…') : label;
    ctx.fillText(texto, 0, 0);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, R*0.1, 0, Math.PI*2);
  ctx.fillStyle = '#0f1020';
  ctx.fill();
  ctx.strokeStyle = '#ffffff33';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function obterVencedor(){
  const n = participantes.length;
  if(n === 0) return null;
  const angSetor = 360 / n;
  const rMod = ((rotacaoDeg % 360) + 360) % 360;
  const a = (360 - rMod) % 360;
  const idx = Math.floor(a / angSetor) % n;
  return { index: idx, nome: participantes[idx] };
}

function girar(){
  if(girando || participantes.length < 1) return;
  girando = true;
  $resultado.textContent = 'Girando...';

  const voltas = 4 + Math.floor(Math.random() * 3);
  const offset = Math.random() * 360;
  const inicio = rotacaoDeg;
  const fim = rotacaoDeg + voltas * 360 + offset;
  const dur = 4500;

  const t0 = performance.now();
  (function anim(now){
    const t = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - t, 3);
    rotacaoDeg = inicio + (fim - inicio) * e;
    desenhar();

    if(t < 1){
      requestAnimationFrame(anim);
    } else {
      rotacaoDeg = fim % 360;
      desenhar();
      const win = obterVencedor();
      if(win){
        mostrarVencedor(win.nome);
        participantes.splice(win.index, 1);
        sorteados.push(win.nome);
        renderLista();
        renderSorteados();
      }
      girando = false;
    }
  })(t0);
}

function renderLista(){
  const n = participantes.length;
  $lista.innerHTML = '';
  participantes.forEach((nome, i)=>{
    const li = document.createElement('li');
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.style.background = corSetor(i, n);

    const txt = document.createElement('span');
    txt.textContent = nome;

    const btn = document.createElement('button');
    btn.textContent = 'remover';
    btn.onclick = ()=>{
      participantes.splice(i,1);
      desenhar();
      renderLista();
      $resultado.textContent = '';
    };

    li.appendChild(tag);
    li.appendChild(txt);
    li.appendChild(btn);
    $lista.appendChild(li);
  });
}

function renderSorteados(){
  $sorteados.innerHTML = '';
  sorteados.forEach(nome => {
    const li = document.createElement('li');
    li.textContent = nome;
    $sorteados.appendChild(li);
  });
}

function adicionar(){
  const nome = $nome.value.trim();
  if(!nome) return;
  if(participantes.includes(nome) || sorteados.includes(nome)){
    $resultado.textContent = 'Nome já adicionado.';
    return;
  }
  participantes.push(nome);
  $nome.value = '';
  renderLista();
  desenhar();
  $resultado.textContent = '';
}

function limpar(){
  participantes = [];
  sorteados = [];
  rotacaoDeg = 0;
  renderLista();
  renderSorteados();
  desenhar();
  $resultado.textContent = '';
}

// Overlay
function mostrarVencedor(nome){
  winnerNameEl.textContent = nome;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
}
overlayClose.addEventListener('click', ()=>{
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
});

// Eventos
$btnAdd.addEventListener('click', adicionar);
$btnSpin.addEventListener('click', girar);
$btnClear.addEventListener('click', limpar);
$nome.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') adicionar(); });
canvas.addEventListener('click', girar);

desenhar();
