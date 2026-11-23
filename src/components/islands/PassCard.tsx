import { BAND_LABEL } from '../../data/roll.ts';
import { fitLabel, fmt, fmtDate, packingHints, type Trip } from '../../lib/dna.ts';
import type { Dna } from '../../data/quiz.ts';
import { matchArchetype } from '../../lib/dna.ts';

export const airportCode = (s: string) => {
  const m = s.match(/\b[A-Za-z]{3}\b/);
  return (m ? m[0] : s.replace(/[^A-Za-z]/g, '').slice(0, 3)).toUpperCase() || '???';
};

const FIT = { strong: 'a strong match', good: 'a good match', stretch: 'a deliberate stretch' } as const;

export default function PassCard({ trip, airport, revealed, dna }: { trip: Trip; airport: string; revealed: boolean; dna: Dna | null }) {
  const d = trip.dest;
  const p = trip.price;
  const arc = dna ? matchArchetype(dna) : null;
  return (
    <div className="pass pass-in">
      <div className="pass-main">
        <div className="pass-top"><strong>TripRoll</strong><span>{revealed ? 'Revealed' : 'Sealed'}</span></div>
        <div className="pass-route">
          <div className="pass-code"><small>From</small>{airportCode(airport)}</div>
          <div className={`flip${revealed ? ' revealed' : ''}`}>
            <div className="flip-inner">
              <div className="face front" aria-hidden={revealed}>
                <span className="tag">Destination</span>
                <span className="big">Sealed</span>
              </div>
              <div className="face back" aria-hidden={!revealed}>
                <span className="tag">Destination</span>
                {revealed && (
                  <>
                    <span className="big">{d.name}</span>
                    <p>{d.country}. {d.blurb}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <dl className="pass-meta">
          <div><dt>Depart</dt><dd>{fmtDate(trip.start)}</dd></div>
          <div><dt>Return</dt><dd>{fmtDate(trip.end)}</dd></div>
          <div><dt>Nights</dt><dd>{trip.nights}</dd></div>
          <div className="span2"><dt>Flight band</dt><dd>{BAND_LABEL[trip.band]}</dd></div>
          <div><dt>Party</dt><dd>{trip.party}</dd></div>
          <div className="span3"><dt>Climate hint</dt><dd>{d.climate}</dd></div>
        </dl>
      </div>
      <div className="pass-perf" aria-hidden="true" />
      <div className="pass-stub">
        <div className="price-row">
          <div><span className="price-tag">Estimated per person</span><span className="price">{fmt(p.perPerson)}</span></div>
          <div className="price-sub">{fmt(p.total)} total, estimate</div>
        </div>
        <dl className="breakdown">
          <div><dt>Flights</dt><dd>{fmt(p.flights)}</dd></div>
          <div><dt>Stay</dt><dd>{fmt(p.hotel)}</dd></div>
          <div><dt>Transfers and experiences</dt><dd>{fmt(p.extras)}</dd></div>
          <div><dt>Planning margin</dt><dd>{fmt(p.service)}</dd></div>
        </dl>
        <ul className="pass-list" aria-label="Packing hints">
          {packingHints(d).map((h) => <li key={h}>{h}</li>)}
        </ul>
        <p className="pass-note">
          {dna && arc
            ? `Travel DNA fit for ${arc.name}: ${FIT[fitLabel(dna, d)]}.`
            : <>Take the <a href="/travel-dna">Travel DNA quiz</a> to tilt rolls toward your taste.</>}
        </p>
      </div>
    </div>
  );
}
