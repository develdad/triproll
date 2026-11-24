import { AXES, type Dna } from '../../data/quiz.ts';

const LABEL: Record<string, string> = { pace: 'Pace', novelty: 'Novelty', setting: 'Setting', comfort: 'Comfort', social: 'Social', structure: 'Structure', culture: 'Culture', activity: 'Activity' };
const CX = 200, CY = 175, R = 108;

const pt = (i: number, v: number, r = R) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
  return [CX + Math.cos(a) * r * v, CY + Math.sin(a) * r * v] as const;
};
const f = (n: number) => n.toFixed(1);

// Eight-axis radar as inline SVG. No script beyond the island that renders it.
export default function Radar({ dna, label }: { dna: Dna; label: string }) {
  const poly = AXES.map((a, i) => pt(i, dna[a]).map(f).join(',')).join(' ');
  return (
    <svg className="radar" viewBox="0 0 400 350" role="img" aria-label={label}>
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon key={r} points={AXES.map((_, i) => pt(i, r).map(f).join(',')).join(' ')} fill="none" stroke="#c9c5b8" strokeWidth={r === 1 ? 1.5 : 1} />
      ))}
      {AXES.map((a, i) => {
        const [x, y] = pt(i, 1);
        const [lx, ly] = pt(i, 1, R + 18);
        const anchor = Math.abs(lx - CX) < 8 ? 'middle' : lx > CX ? 'start' : 'end';
        return (
          <g key={a}>
            <line x1={CX} y1={CY} x2={x} y2={y} stroke="#c9c5b8" strokeWidth="1" />
            <text x={lx} y={ly + 4} textAnchor={anchor}>{LABEL[a]}</text>
          </g>
        );
      })}
      <polygon points={poly} fill="#00a99d" fillOpacity="0.2" stroke="#007a72" strokeWidth="2.5" strokeLinejoin="round" />
      {AXES.map((a, i) => {
        const [x, y] = pt(i, dna[a]);
        return <circle key={a} cx={x} cy={y} r="4" fill="#007a72" />;
      })}
    </svg>
  );
}
