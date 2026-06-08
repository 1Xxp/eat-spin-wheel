import html2canvas from 'html2canvas';

export async function generateShareImage(
  emoji: string,
  dishName: string,
  aiText: string,
): Promise<File | null> {
  const card = document.createElement('div');
  card.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 375px; padding: 24px; font-family: 'PingFang SC', sans-serif;
    background: linear-gradient(135deg, #FFF0E6, #FFE4E1, #F0E6FF);
    border-radius: 24px; text-align: center; box-sizing: border-box;
  `;
  card.innerHTML = `
    <div style="font-size: 12px; color: #B0887A; margin-bottom: 4px;">🎰 今天吃什么</div>
    <div style="font-size: 72px; margin: 12px 0;">${emoji}</div>
    <div style="font-size: 24px; font-weight: 800; color: #5D4037; margin-bottom: 8px;">${dishName}</div>
    <div style="background: rgba(255,107,138,0.1); border-radius: 16px; padding: 14px 20px; margin: 0 8px;">
      <div style="font-size: 15px; color: #E55A77; font-weight: 600; line-height: 1.5;">"${aiText}"</div>
    </div>
    <div style="margin-top: 16px; font-size: 10px; color: #D4B8A8;">— 命运替你做的决定 —</div>
  `;
  document.body.appendChild(card);

  try {
    const canvas = await html2canvas(card, {
      scale: 2,
      backgroundColor: null,
      width: 375,
    });
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png', 0.95));
    if (!blob) return null;
    return new File([blob], `${dishName}.png`, { type: 'image/png' });
  } finally {
    document.body.removeChild(card);
  }
}

export async function shareDish(emoji: string, dishName: string, aiText: string) {
  const file = await generateShareImage(emoji, dishName, aiText);
  if (!file) return;

  const shareData: ShareData = {
    title: `今天吃 ${dishName}！`,
    text: aiText,
    files: [file],
  };

  if (navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return;
    } catch {}
  }

  // 降级：下载图片
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${dishName}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
