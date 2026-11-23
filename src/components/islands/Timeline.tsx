import { TIMELINE } from '../../data/roll.ts';
import Icon from './Icon.tsx';

// 4-step order timeline. `active` is the index of the current step; steps before it are done; -1 means none started.
export default function Timeline({ active = -1, compact = false }: { active?: number; compact?: boolean }) {
  return (
    <ol className={`tl${compact ? ' compact' : ''}`} aria-label="What happens after you request a trip">
      {TIMELINE.map((s, i) => {
        const state = i < active ? 'done' : i === active ? 'current' : 'next';
        return (
          <li key={s.title} className={state} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="tl-dot" aria-hidden="true">{state === 'done' ? <Icon name="check" size={14} /> : i + 1}</span>
            <span className="tl-text"><strong>{s.title}</strong>{!compact && <span>{s.body}</span>}</span>
          </li>
        );
      })}
    </ol>
  );
}
