import { useMemo, useRef, useEffect, useState } from 'react';
import type { Dish } from '../api/types';

const COLORS = [
  '#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C', '#4DABF7',
  '#DA77F2', '#F783AC', '#FF922B', '#20C997', '#845EF7',
  '#F06595', '#74C0FC',
];

interface Props {
  dishes: Dish[];
  spinning: boolean;
  onSpinEnd?: () => void;
}

export default function Wheel({ dishes, spinning, onSpinEnd }: Props) {
  const items = useMemo(() => dishes.filter((d) => d.is_enabled), [dishes]);
  const n = items.length;
  const angle = n > 0 ? 360 / n : 0;
  // 多于20道菜只显示emoji，避免文字挤成一团
  const showName = n <= 20;

  const SIZE = 320;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = SIZE / 2 - 12;

  const [spinKey, setSpinKey] = useState(0);
  const [wobble, setWobble] = useState(false);
  const prevSpinning = useRef(false);
  const curDeg = useRef(0);
  const targetDeg = useRef(0);
  const uid = useRef(Math.floor(Math.random() * 100000));

  useEffect(() => {
    if (spinning && !prevSpinning.current) {
      setWobble(false);
      targetDeg.current = curDeg.current + 1080 + Math.floor(Math.random() * 720);
      setSpinKey(k => k + 1);
    }
    prevSpinning.current = spinning;
  }, [spinning]);

  const sectors = useMemo(() => {
    if (n === 0) return null;
    let accumulated = 0;
    return items.map((dish, i) => {
      const startAngle = accumulated;
      const endAngle = accumulated + angle;
      accumulated = endAngle;

      const startRad = (Math.PI * startAngle) / 180 - Math.PI / 2;
      const endRad = (Math.PI * endAngle) / 180 - Math.PI / 2;

      const x1 = CX + R * Math.cos(startRad);
      const y1 = CY + R * Math.sin(startRad);
      const x2 = CX + R * Math.cos(endRad);
      const y2 = CY + R * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;
      const midRad = (startRad + endRad) / 2;
      const labelR = showName ? R * 0.62 : R * 0.68;
      const labelX = CX + labelR * Math.cos(midRad);
      const labelY = CY + labelR * Math.sin(midRad);

      return {
        dish,
        path: `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`,
        color: COLORS[i % COLORS.length],
        labelX,
        labelY,
        rotation: startAngle + angle / 2,
      };
    });
  }, [items, n, angle, showName]);

  if (n === 0) {
    return (
      <div className="w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] rounded-full bg-white/60 border-2 border-dashed border-brand-200 flex items-center justify-center shadow-lg">
        <p className="text-[#B0887A] text-sm text-center px-8">还没有菜品<br/>点击「我的菜单」添加</p>
      </div>
    );
  }

  const startDeg = curDeg.current;
  const endDeg = targetDeg.current;
  const name = `sw_${uid.current}_${spinKey}`;

  return (
    <div className="relative select-none">
      {/* 外圈光晕 */}
      <div
        className="absolute -inset-4 rounded-full opacity-20 blur-2xl"
        style={{
          background: 'conic-gradient(from 0deg, #FF6B8A, #FFA3B8, #C9B1FF, #FFD93D, #FF6B8A)',
        }}
      />

      {/* 指针 */}
      <div
        className={`absolute -top-2 left-1/2 -translate-x-1/2 z-20 ${wobble ? 'animate-pointer-wobble' : ''}`}
        style={{ transformOrigin: '15px 36px' }}
      >
        <svg width="28" height="32" viewBox="0 0 30 36" style={{ filter: 'drop-shadow(0 2px 3px rgba(255,107,138,0.4))' }}>
          <polygon points="15,36 2,0 28,0" fill="#FF6B8A" stroke="#fff" strokeWidth="2" />
        </svg>
      </div>

      {/* 转盘 */}
      <div
        key={spinKey}
        style={{
          animation: spinKey > 0
            ? `${name} 4s cubic-bezier(0.15, 0.75, 0.15, 0.98) forwards`
            : 'none',
        }}
        onAnimationEnd={() => {
          curDeg.current = endDeg % 360;
          setWobble(true);
          setTimeout(() => {
            setWobble(false);
            onSpinEnd?.();
          }, 600);
        }}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="drop-shadow-[0_4px_20px_rgba(255,107,138,0.2)]"
          style={{ maxWidth: '92vw', maxHeight: '92vw' }}
        >
          {sectors?.map((s, i) => (
            <g key={i}>
              <path d={s.path} fill={s.color} stroke="#fff" strokeWidth="1.8" opacity="0.93" />
              <text
                x={s.labelX}
                y={s.labelY}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#fff"
                fontSize={showName ? 14 : 16}
                fontWeight="800"
                transform={`rotate(${s.rotation}, ${s.labelX}, ${s.labelY})`}
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
              >
                <tspan x={s.labelX} dy={showName ? '-2' : '0'}>{s.dish.emoji}</tspan>
                {showName && (
                  <tspan x={s.labelX} dy="16" fontSize="11" fontWeight="700">
                    {s.dish.name.length > 3 ? s.dish.name.slice(0, 3) + '…' : s.dish.name}
                  </tspan>
                )}
              </text>
            </g>
          ))}

          {/* 中心圆 */}
          <circle cx={CX} cy={CY} r="26" fill="#fff" stroke="#FF6B8A" strokeWidth="3" />
          <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="900" fill="#FF6B8A">
            GO
          </text>
        </svg>
      </div>

      <style>{`
        @keyframes ${name} {
          0%   { transform: rotate(${startDeg}deg); }
          100% { transform: rotate(${endDeg}deg); }
        }
        @keyframes pointer-wobble {
          0%   { transform: translateX(-50%) rotate(0deg); }
          15%  { transform: translateX(-50%) rotate(6deg); }
          30%  { transform: translateX(-50%) rotate(-5deg); }
          45%  { transform: translateX(-50%) rotate(3deg); }
          60%  { transform: translateX(-50%) rotate(-2deg); }
          75%  { transform: translateX(-50%) rotate(1deg); }
          90%  { transform: translateX(-50%) rotate(-0.5deg); }
          100% { transform: translateX(-50%) rotate(0deg); }
        }
        .animate-pointer-wobble {
          animation: pointer-wobble 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
