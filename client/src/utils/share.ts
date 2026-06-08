export async function shareDish(emoji: string, dishName: string, aiText: string): Promise<boolean> {
  const W = 750; const H = 620;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  // 背景渐变
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#FFF0E6');
  grad.addColorStop(0.5, '#FFE4E1');
  grad.addColorStop(1, '#F0E6FF');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(0, 0, W, H, 48); ctx.fill();

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
  const textW = 600; const textH = 120;
  const textX = (W - textW) / 2; const textY = 350;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath(); ctx.roundRect(textX, textY, textW, textH, 32); ctx.fill();

  // 文案
  ctx.fillStyle = '#E55A77';
  ctx.font = 'bold 32px "PingFang SC", "Microsoft YaHei", sans-serif';
  const maxW = textW - 60;
  const words = `"${aiText}"`;
  // 简单折行
  let line = ''; let y = textY + 55;
  for (const ch of words) {
    if (ctx.measureText(line + ch).width > maxW) {
      ctx.fillText(line, W / 2, y);
      line = ch; y += 42;
    } else { line += ch; }
  }
  if (line) ctx.fillText(line, W / 2, y);

  // 底部文字
  ctx.fillStyle = '#D4B8A8';
  ctx.font = '22px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('— 命运替你做的决定 —', W / 2, 550);

  // 导出下载
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) { resolve(false); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${dishName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve(true);
    }, 'image/png');
  });
}
