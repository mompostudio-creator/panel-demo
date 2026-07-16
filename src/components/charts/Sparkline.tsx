export function Sparkline({
  data,
  color = "#2a78d6",
  width = 96,
  height = 32,
  area = false,
  responsive = false,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  area?: boolean;
  responsive?: boolean;
}) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const coords = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * height,
  }));
  const points = coords.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg
      width={responsive ? undefined : width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={responsive ? "w-full h-auto overflow-visible" : "overflow-visible shrink-0"}
    >
      {area && <polygon points={areaPoints} fill={color} opacity={0.14} stroke="none" />}
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
