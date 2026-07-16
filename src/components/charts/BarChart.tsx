"use client";

import { useState } from "react";

interface Bar {
  label: string;
  value: number;
}

export function BarChart({
  data,
  data2,
  color = "#2a78d6",
  color2 = "#1baf7a",
  seriesLabel,
  seriesLabel2,
  height = 180,
  suffix = "",
}: {
  data: Bar[];
  data2?: Bar[];
  color?: string;
  color2?: string;
  seriesLabel?: string;
  seriesLabel2?: string;
  height?: number;
  suffix?: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), ...(data2 ? data2.map((d) => d.value) : []), 1);

  return (
    <div className="w-full">
      {data2 && (seriesLabel || seriesLabel2) && (
        <div className="flex items-center gap-4 mb-3">
          {seriesLabel && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-secondary">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              {seriesLabel}
            </span>
          )}
          {seriesLabel2 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-secondary">
              <span className="w-2 h-2 rounded-full" style={{ background: color2 }} />
              {seriesLabel2}
            </span>
          )}
        </div>
      )}
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max((d.value / max) * 100, 3);
          const h2 = data2 ? Math.max((data2[i].value / max) * 100, 3) : null;
          return (
            <div
              key={d.label}
              className="flex-1 flex flex-col items-center justify-end h-full relative"
              onPointerEnter={() => setHoverIndex(i)}
              onPointerLeave={() => setHoverIndex(null)}
            >
              {h2 === null ? (
                <>
                  <span className="text-[12px] font-semibold tabular text-ink mb-1">
                    {d.value}
                    {suffix}
                  </span>
                  <div
                    className="w-full max-w-[24px] rounded-t-[6px] transition-all duration-150"
                    style={{
                      height: `${h}%`,
                      background: `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`,
                      opacity: hoverIndex === null || hoverIndex === i ? 1 : 0.45,
                      transform: hoverIndex === i ? "scaleX(1.08)" : "scaleX(1)",
                    }}
                  />
                </>
              ) : (
                <div className="flex items-end gap-1 w-full h-full justify-center">
                  <div
                    className="flex-1 max-w-[16px] rounded-t-[5px] transition-all duration-150"
                    style={{
                      height: `${h}%`,
                      background: `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`,
                      opacity: hoverIndex === null || hoverIndex === i ? 1 : 0.45,
                    }}
                  />
                  <div
                    className="flex-1 max-w-[16px] rounded-t-[5px] transition-all duration-150"
                    style={{
                      height: `${h2}%`,
                      background: `linear-gradient(180deg, ${color2} 0%, ${color2}cc 100%)`,
                      opacity: hoverIndex === null || hoverIndex === i ? 1 : 0.45,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="h-px bg-border" />
      <div className="flex gap-2 mt-2">
        {data.map((d) => (
          <div key={d.label} className="flex-1 text-center text-[11px] text-ink-muted truncate">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
