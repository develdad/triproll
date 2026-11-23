import { AXES } from '../../lib/dna.ts';
import type { Dna } from '../../data/quiz.ts';

const LABEL: Record<string, string> = { adventure: 'Adventure', social: 'Social', structure: 'Structure', cultural: 'Culture', budget: 'Budget', energy: 'Energy' };
const CX = 180, CY = 165, R = 100;

const pt = (i: number, v: number, r = R) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
  return [CX + Math.cos(a) * r * v, CY + Math.sin(a) * r * v] as const;
};

export default function Radar({ dna, label }: { dna: Dna; label: string }) {
  const poly = AXES.map((a, i) => pt(i, dna[a]).map((n) => n.toFixed(1)).join(',')).join(' ');
  return (
    <svg className="radar" viewBox="0 0 360 330" role="img" aria-label={label}>
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon key={r} points={AXES.map((_, i) => pt(i, r).map((n) => n.toFixed(1)).join(',')).join(' ')} fill="none" stroke="#c9c5b8" strokeWidth={r === 1 ? 1.5 : 1} />
      ))}
      {AXES.map((a, i) => {
        const [x, y] = pt(i, 1);
        const [lx, ly] = pt(i, 1, R + 22);
        const anchor = Math.abs(lx - CX) < 6 ? 'middle' : lx > CX ? 'start' : 'end';
        return (
          <g key={a}>
            <line x1={CX} y1={CY} x2={x} y2={y} stroke="#c9c5b8" strokeWidth="1" />
            <text x={lx} y={ly + 4} textAnchor={anchor}>{LABEL[a]}</text>
          </g>
        );
      })}
      <polygon points={poly} fill="#0d7377" fillOpacity="0.18" stroke="#0d7377" strokeWidth="2.5" strokeLinejoin="round" />
      {AXES.map((a, i) => {
        const [x, y] = pt(i, dna[a]);
        return <circle key={a} cx={x} cy={y} r="4" fill="#0d7377" />;
      })}
    </svg>
  );
}
