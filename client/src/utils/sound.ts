let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
  return ctx;
}

// 确保 AudioContext 在用户交互后恢复（浏览器自动播放策略）
export function resumeAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume();
}

// 短促的刻度音——转盘经过指针时播放
export function playTick() {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = 1800 + Math.random() * 400;
  gain.gain.setValueAtTime(0.06, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.05);
}

// 揭晓音——转盘停止时播放（上升双音）
export function playReveal() {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  [523, 784].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const t = now + i * 0.12;
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

// 确认音——点击"就它了"时播放
export function playConfirm() {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  [659, 784, 1047].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = now + i * 0.08;
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  });
}
