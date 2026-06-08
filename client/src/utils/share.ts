import html2canvas from 'html2canvas';

export async function generateShareImage(
  emoji: string,
  dishName: string,
  aiText: string,
): Promise<string | null> {
  const card = document.createElement('div');
  card.style.cssText = `
    position: fixed; left: 0; top: 0;
    width: 375px; padding: 28px 24px; font-family: 'PingFang SC', sans-serif;
    background: linear-gradient(135deg, #FFF0E6 0%, #FFE4E1 50%, #F0E6FF 100%);
    text-align: center; box-sizing: border-box; z-index: -1;
  `;
  card.innerHTML = `
    <div style="font-size: 12px; color: #B0887A; margin-bottom: 6px; letter-spacing: 2px;">🎰 今天吃什么</div>
    <div style="font-size: 80px; margin: 16px 0;">${emoji}</div>
    <div style="font-size: 26px; font-weight: 800; color: #5D4037; margin-bottom: 12px;">${dishName}</div>
    <div style="background: rgba(255,255,255,0.7); border-radius: 16px; padding: 16px 20px; margin: 0 4px;">
      <div style="font-size: 16px; color: #E55A77; font-weight: 600; line-height: 1.6;">"${aiText}"</div>
    </div>
    <div style="margin-top: 18px; font-size: 11px; color: #D4B8A8;">— 命运替你做的决定 —</div>
  `;
  document.body.appendChild(card);

  try {
    const canvas = await html2canvas(card, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      logging: false,
    });
    const dataUrl = canvas.toDataURL('image/png', 0.92);
    return dataUrl;
  } catch (e) {
    console.error('生成图片失败:', e);
    return null;
  } finally {
    document.body.removeChild(card);
  }
}

export async function shareDish(emoji: string, dishName: string, aiText: string): Promise<boolean> {
  const dataUrl = await generateShareImage(emoji, dishName, aiText);
  if (!dataUrl) return false;

  // 先转成 Blob
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], `${dishName}.png`, { type: 'image/png' });

  // 尝试系统分享
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `今天吃 ${dishName}！` });
      return true;
    } catch (e: any) {
      if (e.name === 'AbortError') return false;
    }
  }

  // 降级：触发下载
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${dishName}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return true;
}
