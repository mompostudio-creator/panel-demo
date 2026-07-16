"use client";

import { useId, useRef, useState } from "react";

interface Point {
  date: string;
  value: number;
}

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function LineChart({
  data,
  color = "#2a78d6",
  height = 160,
}: {
  data: Point[];
  color?: string;
  height?: number;
}) {
  const width = 600;
  const padding = { top: 28, right: 8, bottom: 8, left: 8 };
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gradientId = `line-gradient-${useId()}`;

  const max = Math.max(...data.map((d) => d.value), 1);
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = padding.top + innerH - (d.value / max) * innerH;
    return { x, y, ...d };
  });

  const linePath = smoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + innerH} L ${points[0].x} ${padding.top + innerH} Z`;

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    let closest = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setHoverIndex(closest);
  }

  const gridSteps = [0, 0.5, 1];
  const hp = hoverIndex !== null ? points[hoverIndex] : null;

  const lastPoint = points[points.length - 1];
  const maxIndex = points.reduce((best, p, i) => (p.value > points[best].value ? i : best), 0);
  const maxPoint = points[maxIndex];
  const showMaxLabel = maxIndex !== points.length - 1 && maxPoint.value > 0;

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto touch-none"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {gridSteps.map((g) => (
          <line
            key={g}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + innerH * g}
            y2={padding.top + innerH * g}
            stroke="#e1e0d9"
            strokeWidth={1}
            strokeDasharray={g === 1 ? undefined : "3 4"}
          />
        ))}
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {hp && (
          <line x1={hp.x} x2={hp.x} y1={padding.top} y2={padding.top + innerH} stroke="#c3c2b7" strokeWidth={1} />
        )}
        {hp && <circle cx={hp.x} cy={hp.y} r={5.5} fill={color} stroke="#fcfcfb" strokeWidth={2.5} />}
        <circle cx={lastPoint.x} cy={lastPoint.y} r={4.5} fill={color} stroke="#fcfcfb" strokeWidth={2.5} />

        {showMaxLabel && (
          <text
            x={maxPoint.x}
            y={Math.max(maxPoint.y - 10, 12)}
            textAnchor={maxIndex === 0 ? "start" : maxIndex === points.length - 1 ? "end" : "middle"}
            className="text-[13px] font-semibold tabular"
            fill="#0b0b0b"
          >
            {maxPoint.value}
          </text>
        )}
        <text
          x={lastPoint.x}
          y={Math.max(lastPoint.y - 10, 12)}
          textAnchor="end"
          className="text-[13px] font-semibold tabular"
          fill="#0b0b0b"
        >
          {lastPoint.value}
        </text>
      </svg>
      {hp && (
        <div
          className="absolute -translate-x-1/2 bg-ink text-white text-xs rounded-lg px-2.5 py-1.5 pointer-events-none shadow-lg whitespace-nowrap z-10"
          style={{
            left: `${(hp.x / width) * 100}%`,
            top: `${Math.max((hp.y / height) * 100 - 14, 0)}%`,
          }}
        >
          <span className="font-semibold tabular">{hp.value}</span>
          <span className="text-white/60 ml-1.5">{hp.date}</span>
        </div>
      )}
      <div className="flex items-center justify-between mt-1.5 px-0.5">
        <span className="text-[11px] text-ink-muted">{data[0]?.date}</span>
        <span className="text-[11px] text-ink-muted">{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
