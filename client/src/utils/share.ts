export function shareDish(emoji: string, dishName: string, aiText: string): string | null {
  const W = 750; const H = 620;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 背景
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#FFF0E6');
  grad.addColorStop(0.5, '#FFE4E1');
  grad.addColorStop(1, '#F0E6FF');
  ctx.fillStyle = grad;
  roundFill(ctx, 0, 0, W, H, 48);

  // 标题
  ctx.fillStyle = '#B0887A';
  ctx.font = '24px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎰 今天吃什么', W / 2, 60);

  // Emoji
  ctx.font = '160px serif';
  ctx.fillText(emoji, W / 2, 240);

  // 菜名
  ctx.fillStyle = '#5D4037';
  ctx.font = 'bold 52px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(dishName, W / 2, 310);

  // 文案背景
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  roundFill(ctx, 75, 350, 600, 120, 32);

  // 文案
  ctx.fillStyle = '#E55A77';
  ctx.font = 'bold 32px "PingFang SC", "Microsoft YaHei", sans-serif';
  const words = `"${aiText}"`;
  let line = ''; let y = 405;
  for (const ch of words) {
    if (ctx.measureText(line + ch).width > 540) { ctx.fillText(line, W / 2, y); line = ch; y += 42; }
    else line += ch;
  }
  if (line) ctx.fillText(line, W / 2, y);

  // 底部
  ctx.fillStyle = '#D4B8A8';
  ctx.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('— 命运替你做的决定 —', W / 2, 550);

  return canvas.toDataURL('image/png');
}

function roundFill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}
