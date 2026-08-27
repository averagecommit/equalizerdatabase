/**
 * EqChart — renders a parametric/graphic EQ curve as an SVG line, styled like
 * a telemetry readout (gridlines + glowing line + area fill).
 *
 * The two things worth actually understanding here, not just copy-pasting:
 *
 * 1. FREQUENCY IS PLOTTED ON A LOG SCALE, NOT LINEAR.
 *    Human hearing perceives frequency logarithmically — the jump from
 *    100Hz to 200Hz sounds like the same "distance" as 1000Hz to 2000Hz,
 *    even though the second gap is 10x larger in raw Hz. Every real EQ UI
 *    (this one, Equalizer APO, your headphone's own app) plots frequency
 *    this way. If you plot bands on a LINEAR x-axis instead, all your bass
 *    bands (20–500Hz) get crushed into the first 5% of the chart and it
 *    stops being readable. This is the one piece of DSP-adjacent knowledge
 *    that separates "I built a line chart" from "I understand what an EQ
 *    curve actually represents."
 *
 * 2. THE CURVE IS SMOOTHED WITH A CATMULL-ROM SPLINE, NOT STRAIGHT LINES.
 *    A real analog/digital filter's frequency response is a smooth curve —
 *    connecting your band points with straight lines (a "polyline") would
 *    visually claim sharp corners in the response that don't physically
 *    exist. catmullRomToBezierPath() converts your discrete points into a
 *    smooth cubic-bezier path that passes through every point. This does
 *    NOT simulate the actual filter math (a real parametric EQ's shape also
 *    depends on Q-factor and filter type) — it's a visual approximation.
 *    Know that distinction if anyone asks you about it.
 */

const FREQ_MIN = 20;
const FREQ_MAX = 20000;

function xForFreq(freq, width) {
  const f = Math.min(Math.max(freq, FREQ_MIN), FREQ_MAX);
  const t = (Math.log10(f) - Math.log10(FREQ_MIN)) / (Math.log10(FREQ_MAX) - Math.log10(FREQ_MIN));
  return t * width;
}

function formatFreq(freq) {
  if (freq >= 1000) {
    const k = freq / 1000;
    return `${k % 1 === 0 ? k : k.toFixed(1)}k`;
  }
  return `${freq}`;
}

// Converts an ordered list of {x,y} points into a smooth SVG path string
// that passes through every point, using Catmull-Rom -> cubic Bezier conversion.
function catmullRomToBezierPath(points) {
  if (points.length < 2) return '';
  const p = points;
  let d = `M ${p[0].x},${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i === 0 ? i : i - 1];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2 < p.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export default function EqChart({ bands, preampGain = 0, height = 280 }) {
  const width = 800; // viewBox units — scales responsively via the svg element
  const padTop = 28;
  const padBottom = 34;
  const padX = 8;
  const plotW = width - padX * 2;
  const plotH = height - padTop - padBottom;

  const sorted = [...(bands || [])].sort((a, b) => a.frequency - b.frequency);
  const gains = sorted.map((b) => b.gain);
  const maxAbsGain = Math.max(6, ...gains.map((g) => Math.abs(g)));
  const dbMax = Math.ceil(maxAbsGain / 3) * 3;

  const yForDb = (db) => {
    const clamped = Math.min(Math.max(db, -dbMax), dbMax);
    return padTop + plotH / 2 - (clamped / dbMax) * (plotH / 2);
  };

  const points = sorted.map((b) => ({
    x: padX + xForFreq(b.frequency, plotW),
    y: yForDb(b.gain),
  }));

  const linePath = catmullRomToBezierPath(points);
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x},${padTop + plotH} L ${points[0].x},${padTop + plotH} Z`
      : '';

  const gridTicks = [dbMax, 0, -dbMax];
  const freqTickValues = sorted.length > 0 ? sorted.map((b) => b.frequency) : [62, 250, 1000, 4000, 8000, 16000];

  if (sorted.length === 0) {
    return (
      <div className="w-full flex items-center justify-center h-[280px] font-mono text-xs text-[var(--text-faint)]">
        no band data
      </div>
    );
  }

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="EQ frequency response curve">
        <defs>
          <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--papaya)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--papaya)" stopOpacity="0" />
          </linearGradient>
          <filter id="eqGlow" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* gridlines + dB labels */}
        {gridTicks.map((db) => (
          <g key={db}>
            <line
              x1={padX}
              x2={width - padX}
              y1={yForDb(db)}
              y2={yForDb(db)}
              stroke="var(--line)"
              strokeWidth="1"
              strokeDasharray={db === 0 ? '0' : '2,4'}
            />
            <text x={2} y={yForDb(db) + 5} className="font-mono" fontSize="14" fontWeight="600" fill="var(--text)">
              {db > 0 ? `+${db}` : db}
            </text>
          </g>
        ))}

        {/* frequency tick labels */}
        {freqTickValues.map((f) => (
          <text
            key={f}
            x={padX + xForFreq(f, plotW)}
            y={height - 8}
            textAnchor="middle"
            className="font-mono"
            fontSize="14"
            fontWeight="600"
            fill="var(--text)"
          >
            {formatFreq(f)}
          </text>
        ))}

        {/* area + line */}
        {areaPath && <path d={areaPath} fill="url(#eqFill)" />}
        <path d={linePath} fill="none" stroke="var(--papaya)" strokeWidth="2.5" filter="url(#eqGlow)" />

        {/* points */}
        {points.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="var(--bg-panel)" stroke="var(--papaya)" strokeWidth="2" />
        ))}

        {/* per-band gain labels — placed above the point, or below when a
            positive-gain point sits too close to the top edge of the plot */}
        {points.map((pt, i) => {
          const gain = sorted[i].gain;
          const label = gain > 0 ? `+${gain}` : `${gain}`;
          const tooCloseToTop = pt.y - padTop < 16;
          const labelY = tooCloseToTop ? pt.y + 18 : pt.y - 12;
          return (
            <text
              key={i}
              x={pt.x}
              y={labelY}
              textAnchor="middle"
              className="font-mono"
              fontSize="12"
              fontWeight="700"
              fill="var(--papaya)"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {preampGain !== undefined && (
        <p className="font-mono text-xs text-[var(--down)] mt-1 pl-1">
          Preamp {preampGain > 0 ? `+${preampGain}` : preampGain} dB
        </p>
      )}
    </div>
  );
}
