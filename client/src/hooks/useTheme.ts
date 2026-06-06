import { useState, useEffect, useCallback } from 'react';

export type ThemeName = 'peach' | 'sky' | 'lavender' | 'mint' | 'sunset';

const THEMES: Record<ThemeName, { label: string; icon: string; bg: string; glow1: string; glow2: string; glow3: string; dot: string }> = {
  peach:    { label: '蜜桃', icon: '🍑', bg: '#FFF5F0', glow1: 'rgba(255,182,193,0.3)', glow2: 'rgba(255,218,185,0.3)', glow3: 'rgba(200,180,255,0.2)', dot: 'rgba(255,107,138,0.08)' },
  sky:      { label: '天空', icon: '🩵', bg: '#F0F7FF', glow1: 'rgba(135,206,250,0.3)', glow2: 'rgba(176,224,255,0.3)', glow3: 'rgba(200,220,255,0.25)', dot: 'rgba(70,160,240,0.08)' },
  lavender: { label: '薰衣草', icon: '💜', bg: '#F8F5FF', glow1: 'rgba(200,180,255,0.3)', glow2: 'rgba(220,200,255,0.3)', glow3: 'rgba(210,190,255,0.2)', dot: 'rgba(145,120,230,0.08)' },
  mint:     { label: '薄荷', icon: '🌿', bg: '#F2FFF8', glow1: 'rgba(140,225,190,0.3)', glow2: 'rgba(180,230,200,0.3)', glow3: 'rgba(200,240,220,0.25)', dot: 'rgba(60,195,150,0.08)' },
  sunset:   { label: '日落', icon: '🌅', bg: '#FFF6F0', glow1: 'rgba(255,180,140,0.3)', glow2: 'rgba(255,200,150,0.3)', glow3: 'rgba(255,160,180,0.2)', dot: 'rgba(255,130,80,0.08)' },
};

const STORAGE_KEY = 'eat-wheel-theme';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>(() => {
    return (localStorage.getItem(STORAGE_KEY) as ThemeName) || 'peach';
  });

  useEffect(() => {
    const t = THEMES[theme];
    const body = document.body;
    body.setAttribute('data-theme', theme);
    body.style.backgroundColor = t.bg;
    body.style.backgroundImage = `
      radial-gradient(circle at 20% 80%, ${t.glow1} 0%, transparent 40%),
      radial-gradient(circle at 80% 20%, ${t.glow2} 0%, transparent 40%),
      radial-gradient(circle at 50% 50%, ${t.glow3} 0%, transparent 50%),
      radial-gradient(circle, ${t.dot} 1px, transparent 1px)
    `;
    body.style.backgroundSize = '100% 100%, 100% 100%, 100% 100%, 24px 24px';
    localStorage.setItem(STORAGE_KEY, theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t.bg);
  }, [theme]);

  const cycle = useCallback(() => {
    const names = Object.keys(THEMES) as ThemeName[];
    const idx = names.indexOf(theme);
    setTheme(names[(idx + 1) % names.length]);
  }, [theme]);

  const info = THEMES[theme];

  return { theme, setTheme, cycle, info, themes: THEMES };
}
