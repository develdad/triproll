"use client";

type RadarChartProps = {
  axes: {
    adventure: number;
    social: number;
    structure: number;
    cultural: number;
    budget: number;
    energy: number;
  };
};

const AXIS_LABELS: { key: keyof RadarChartProps["axes"]; label: string; lowLabel: string; highLabel: string }[] = [
  { key: "adventure", label: "Adventure", lowLabel: "Relaxation", highLabel: "Adventure" },
  { key: "social", label: "Social", lowLabel: "Solitary", highLabel: "Social" },
  { key: "structure", label: "Structure", lowLabel: "Spontaneous", highLabel: "Structured" },
  { key: "cultural", label: "Cultural", lowLabel: "Sensory", highLabel: "Cultural" },
  { key: "budget", label: "Budget", lowLabel: "Budget", highLabel: "Splurge" },
  { key: "energy", label: "Energy", lowLabel: "Calm", highLabel: "Energetic" },
];

export default function RadarChart({ axes }: RadarChartProps) {
  const cx = 200;
  const cy = 200;
  const maxRadius = 140;
  const levels = 4;
  const numAxes = AXIS_LABELS.length;
  const angleStep = (2 * Math.PI) / numAxes;
  // Rotate so "Adventure" points up
  const startAngle = -Math.PI / 2;

  // Get point on the radar for a given axis index and value (0 to 1, where 0 = center)
  const getPoint = (index: number, normalizedValue: number) => {
    const angle = startAngle + index * angleStep;
    const r = normalizedValue * maxRadius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Normalize axis values from [-2, 2] range to [0, 1]
  // Axes accumulate across questions, so max possible depends on question count per axis
  // Most axes have 1 question, so range is -1 to 1. Normalize to 0.2-1.0 for visual clarity.
  const normalize = (value: number) => {
    const clamped = Math.max(-2, Math.min(2, value));
    return 0.15 + ((clamped + 2) / 4) * 0.85;
  };

  // Build the data polygon
  const dataPoints = AXIS_LABELS.map((axis, i) => {
    const norm = normalize(axes[axis.key]);
    return getPoint(i, norm);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  // Build grid polygons
  const gridPolygons = Array.from({ length: levels }, (_, level) => {
    const r = ((level + 1) / levels);
    const points = Array.from({ length: numAxes }, (_, i) => getPoint(i, r));
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  });

  // Axis lines from center to edge
  const axisLines = Array.from({ length: numAxes }, (_, i) => {
    const outer = getPoint(i, 1);
    return { x1: cx, y1: cy, x2: outer.x, y2: outer.y };
  });

  // Label positions (slightly outside the chart)
  const labelPoints = AXIS_LABELS.map((axis, i) => {
    const angle = startAngle + i * angleStep;
    const labelR = maxRadius + 32;
    return {
      x: cx + labelR * Math.cos(angle),
      y: cy + labelR * Math.sin(angle),
      axis,
      value: axes[axis.key],
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 400 400" className="w-full max-w-md" aria-label="Travel DNA radar chart">
        {/* Grid */}
        {gridPolygons.map((path, i) => (
          <path
            key={`grid-${i}`}
            d={path}
            fill="none"
            stroke="#B2BEC3"
            strokeWidth={i === gridPolygons.length - 1 ? 1.5 : 0.75}
            opacity={0.4}
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((line, i) => (
          <line
            key={`axis-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#B2BEC3"
            strokeWidth={0.75}
            opacity={0.4}
          />
        ))}

        {/* Data polygon fill */}
        <path
          d={dataPath}
          fill="rgba(13, 115, 119, 0.15)"
          stroke="#0D7377"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={`point-${i}`}
            cx={p.x}
            cy={p.y}
            r={5}
            fill="#0D7377"
            stroke="white"
            strokeWidth={2}
          />
        ))}

        {/* Labels */}
        {labelPoints.map((lp, i) => {
          const displayLabel = lp.value >= 0 ? lp.axis.highLabel : lp.axis.lowLabel;
          return (
            <text
              key={`label-${i}`}
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-xs font-semibold"
              fill="#2D3436"
            >
              {displayLabel}
            </text>
          );
        })}
      </svg>

      {/* Legend below the chart */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 w-full max-w-md">
        {AXIS_LABELS.map((axis) => {
          const value = axes[axis.key];
          const displayLabel = value >= 0 ? axis.highLabel : axis.lowLabel;
          const intensity = Math.abs(value);
          const strengthLabel = intensity >= 2 ? "Strong" : intensity >= 1 ? "Moderate" : "Mild";
          return (
            <div key={axis.key} className="bg-cloud rounded-lg px-3 py-2 text-center">
              <div className="text-xs text-slate">{axis.label}</div>
              <div className="text-sm font-semibold text-teal-deep">{displayLabel}</div>
              <div className="text-xs text-silver">{strengthLabel}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
