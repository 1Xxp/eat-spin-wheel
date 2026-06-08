import html2canvas from 'html2canvas';

export async function shareDish(emoji: string, dishName: string, aiText: string): Promise<boolean> {
  const card = document.createElement('div');
  card.style.cssText = `
    position: fixed; left: 0; top: 0;
    width: 375px; padding: 28px 24px; font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
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
    const canvas = await html2canvas(card, { scale: 2, backgroundColor: null, useCORS: true, logging: false });
    document.body.removeChild(card);

    // 直接触发下载（最可靠）
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dishName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');

    return true;
  } catch (e) {
    document.body.removeChild(card);
    return false;
  }
}
