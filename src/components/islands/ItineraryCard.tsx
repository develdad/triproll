import { BAND_LABEL } from '../../data/roll.ts';
import { fitLabel, fmt, fmtDate, matchArchetype, packingHints, type Trip } from '../../lib/dna.ts';
import type { Dna } from '../../data/quiz.ts';
import Icon from './Icon.tsx';
import Timeline from './Timeline.tsx';

export type MoodImage = { src: string; alt: string; width: number; height: number };

export const airportCode = (s: string) => {
  const m = s.match(/\b[A-Za-z]{3}\b/);
  return (m ? m[0] : s.replace(/[^A-Za-z]/g, '').slice(0, 3)).toUpperCase() || '???';
};

const FIT = { strong: 'a strong match', good: 'a good match', stretch: 'a deliberate stretch' } as const;
const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// Reference code generated in the browser when a roll is made. Not an order number, just a label for the draft.
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
  trip: Trip;
  airport: string;
  revealed: boolean;
  dna: Dna | null;
  mood: MoodImage;
  refCode: string;
  example?: boolean;
};

export default function ItineraryCard({ trip, airport, revealed, dna, mood, refCode, example = false }: Props) {
  const d = trip.dest;
  const p = trip.price;
  const arc = dna ? matchArchetype(dna) : null;
  const rooms = Math.ceil(trip.party / 2);
  const code = airportCode(airport);
  const title = revealed ? 'Your trip' : 'Your sealed trip';
  const label = example ? 'Example sealed itinerary with sample numbers' : undefined;

  return (
    <article className={`trip-card${example ? ' example' : ''}${revealed ? ' is-revealed' : ''}`} aria-label={label ?? `${title}, ${fmtDate(trip.start)} to ${fmtDate(trip.end)}`}>
      <header className="tc-head">
        <img src={mood.src} alt={mood.alt} width={mood.width} height={mood.height} loading={example ? 'eager' : 'lazy'} decoding="async" {...(example ? { fetchPriority: 'high' as const } : {})} />
        <div className="tc-scrim" aria-hidden="true" />
        <div className="tc-head-top">
          <span className={`chip-status ${revealed ? 'open' : 'sealed'}`}><Icon name={revealed ? 'pin' : 'lock'} size={14} />{revealed ? 'Revealed' : 'Sealed'}</span>
          <span className="tc-ref" title="Draft reference">{refCode}</span>
        </div>
        <div className="tc-head-bottom">
          <h3>{title}</h3>
          <p>{fmtDate(trip.start)} to {fmtDate(trip.end)}<span className="dotsep" aria-hidden="true" />{trip.nights} nights<span className="dotsep" aria-hidden="true" />{trip.party} {trip.party === 1 ? 'traveler' : 'travelers'}</p>
        </div>
      </header>

      <div className="tc-body">
        <div className={`dest-panel${revealed ? ' open' : ''}`}>
          <div className="dest-sealed" aria-hidden={revealed}>
            <img src={mood.src} alt="" aria-hidden="true" role="presentation" width={mood.width} height={mood.height} loading="lazy" decoding="async" />
            <div className="dest-frost">
              <Seal />
              <div>
                <span className="k">Destination</span>
                <strong>Sealed</strong>
                <span className="sub">Opens on reveal</span>
              </div>
            </div>
          </div>
          <div className="dest-open" aria-hidden={!revealed}>
            <span className="k">Destination</span>
            {revealed && (
              <>
                <strong>{d.name}</strong>
                <span className="country">{d.country}</span>
                <p>{d.blurb}</p>
              </>
            )}
          </div>
        </div>

        <ul className="tc-sections">
          <li>
            <span className="ic"><Icon name="plane" /></span>
            <div><h4>Flights</h4><p>Round trip from {code}. {BAND_LABEL[trip.band]}.</p><p className="soft">Carrier and times arrive with your itinerary.</p></div>
          </li>
          <li>
            <span className="ic"><Icon name="bed" /></span>
            <div><h4>Stay</h4><p>{trip.nights} nights, {rooms} {rooms === 1 ? 'room' : 'rooms'} for {trip.party} {trip.party === 1 ? 'traveler' : 'travelers'}.</p><p className="soft">Hotel named in your itinerary.</p></div>
          </li>
          <li>
            <span className="ic"><Icon name="car" /></span>
            <div><h4>Transfers</h4><p>Airport to your stay and back, arranged for you.</p></div>
          </li>
          <li>
            <span className="ic"><Icon name="compass" /></span>
            <div><h4>Experiences</h4><p>A few curated picks{arc ? ` for ${arc.name}` : ''}, with room left to wander.</p></div>
          </li>
          <li className="wide">
            <span className="ic"><Icon name="bag" /></span>
            <div><h4>Packing hints</h4>
              <ul className="hints">{packingHints(d).map((h) => <li key={h}>{h}</li>)}</ul></div>
          </li>
          <li className="wide">
            <span className="ic"><Icon name="sun" /></span>
            <div><h4>Climate</h4><p>{d.climate}</p></div>
          </li>
        </ul>

        <div className="tc-perf" aria-hidden="true" />
        <div className="tc-price">
          <div className="pp">
            <span className="k">Estimated package price</span>
            <span className="price">{fmt(p.perPerson)}<small>per person</small></span>
          </div>
          <div className="tot">
            <span className="k">Total for {trip.party}</span>
            <strong>{fmt(p.total)}</strong>
          </div>
          <p className="est"><Icon name="tag" size={15} />An estimate until a person confirms your trip.{' '}
            {dna && arc ? `Travel DNA fit for ${arc.name}: ${FIT[fitLabel(dna, d)]}.` : ''}</p>
        </div>
        <div className="tc-next">
          <h4>What happens next</h4>
          <Timeline compact />
        </div>
      </div>
    </article>
  );
}
