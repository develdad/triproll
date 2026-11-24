import { VETOES } from '../../data/roll.ts';
import { fmt, fmtDate, type Passport } from '../../lib/dna.ts';
import { CABIN_LABEL, type Sealed } from '../../lib/request.ts';
import Icon from './Icon.tsx';
import Timeline from './Timeline.tsx';

export type MoodImage = { src: string; alt: string; width: number; height: number };

export const airportCode = (s: string) => {
  const m = s.match(/\b[A-Za-z]{3}\b/);
  return (m ? m[0] : s.replace(/[^A-Za-z]/g, '').slice(0, 3)).toUpperCase() || '???';
};

const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// Reference code generated in the browser when the rules are sealed. Not an order number, just a label for the draft.
export function makeRef(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return 'TR-' + Array.from(bytes, (b) => REF_CHARS[b % REF_CHARS.length]).join('');
}

function Seal() {
  return (
    <svg className="seal" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M32 3l5 4.2 6.4-1.2 2.6 6 6.3 1.6.2 6.6 5.2 4-2.2 6.2 3 5.9-4.8 4.5.1 6.6-6.4 1.9-3 5.8-6.5-.8L32 61l-5-4.2-6.4 1.2-2.6-6-6.3-1.6-.2-6.6-5.2-4 2.2-6.2-3-5.9 4.8-4.5-.1-6.6 6.4-1.9 3-5.8 6.5.8z" fill="#b4412f" />
      <circle cx="32" cy="32" r="19" fill="none" stroke="#e9a79a" strokeWidth="1.5" opacity="0.8" />
      <g transform="translate(20 20) scale(1)" fill="none" stroke="#fff3ee" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11.5" width="14" height="9.5" rx="2.4" /><path d="M8 11.5V9a4 4 0 0 1 8 0v2.5M12 15v3" /></g>
    </svg>
  );
}

type Props = {
  sealed: Sealed;
  airport: string;
  archetypeName: string | null;
  mood: MoodImage;
  refCode: string;
  passport?: Passport;
  example?: boolean;
};

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// "Mar 14 to Mar 19, 2027" when both dates share a year, otherwise the full dates.
function fmtRange(a: string, b: string): string {
  const [ya, ma, da] = a.split('-').map(Number), [yb, mb, db] = b.split('-').map(Number);
  return ya === yb ? `${MON[ma - 1]} ${da} to ${MON[mb - 1]} ${db}, ${yb}` : `${fmtDate(a)} to ${fmtDate(b)}`;
}
const vetoLabel = (id: string) => VETOES.find((v) => v.id === id)?.label ?? id;

// The sealed request card. It never contains a destination: only the rules, the dates, the package price and
// general facts computed from the catalog (how many places are in play and a broad climate range).
export default function ItineraryCard({ sealed: s, airport, archetypeName, mood, refCode, example = false }: Props) {
  const code = airportCode(airport);
  const label = example ? 'Example sealed request with sample numbers' : `Your sealed trip, ${fmtRange(s.start, s.end)}`;
  const rules = [...s.vetoes.map(vetoLabel), s.passport === 'valid' ? 'Valid passport' : 'No passport, domestic only'];

  return (
    <article className={`trip-card${example ? ' example' : ''}`} aria-label={label}>
      <header className="tc-head">
        <img src={mood.src} alt={mood.alt} width={mood.width} height={mood.height} loading="lazy" decoding="async" />
        <div className="tc-scrim" aria-hidden="true" />
        <div className="tc-head-top">
          <span className="chip-status sealed"><Icon name="lock" size={14} />Sealed</span>
          <span className="tc-ref" title="Draft reference">{refCode}</span>
        </div>
        <div className="tc-head-bottom">
          <h3>Your sealed trip</h3>
          <p>{fmtRange(s.start, s.end)}<span className="dotsep" aria-hidden="true" />{s.nights} nights<span className="dotsep" aria-hidden="true" />{s.party} {s.party === 1 ? 'traveler' : 'travelers'}</p>
        </div>
      </header>

      <div className="tc-body">
        <div className="dest-panel">
          <div className="dest-sealed">
            <img src={mood.src} alt="" aria-hidden="true" role="presentation" width={mood.width} height={mood.height} loading="lazy" decoding="async" />
            <div className="dest-frost">
              <Seal />
              <div>
                <span className="k">Destination</span>
                <strong>Sealed</strong>
                <span className="sub">A person picks it after you request</span>
              </div>
            </div>
          </div>
        </div>

        <ul className="tc-sections">
          <li>
            <span className="ic"><Icon name="plane" /></span>
            <div><h4>Departure</h4><p>Round trip from {code}. {CABIN_LABEL[s.cabin]}.</p></div>
          </li>
          <li>
            <span className="ic"><Icon name="globe" /></span>
            <div><h4>In play</h4><p>{s.count} destinations in play for these rules.</p></div>
          </li>
          <li>
            <span className="ic"><Icon name="sun" /></span>
            <div><h4>Climate range</h4><p>{s.climate}</p></div>
          </li>
          <li>
            <span className="ic"><Icon name="shield" /></span>
            <div><h4>Rules we honor</h4>
              <ul className="hints">{rules.map((r) => <li key={r}>{r}</li>)}</ul></div>
          </li>
          <li>
            <span className="ic"><Icon name="bag" /></span>
            <div><h4>Packing</h4><p>Your packing list arrives at confirmation.</p></div>
          </li>
          {archetypeName && (
            <li>
              <span className="ic"><Icon name="compass" /></span>
              <div><h4>Travel DNA</h4><p>{archetypeName}.</p></div>
            </li>
          )}
        </ul>

        <div className="tc-perf" aria-hidden="true" />
        <div className="tc-price">
          <div className="pp">
            <span className="k">Package price</span>
            <span className="price">{fmt(s.perPerson)}<small>per person</small></span>
          </div>
          <div className="tot">
            <span className="k">Total for {s.party}</span>
            <strong>{fmt(s.total)}</strong>
          </div>
          <p className="est"><Icon name="tag" size={15} />Your budget is the package price. A person builds and books the real trip.</p>
        </div>
        <div className="tc-next">
          <h4>What happens next</h4>
          <Timeline compact />
        </div>
      </div>
    </article>
  );
}
