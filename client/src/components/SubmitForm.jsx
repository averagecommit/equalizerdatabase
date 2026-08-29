import { useState, useEffect } from 'react';

export default function SubmitForm({ device, onSuccess, onCancel }) {
  const hasAppEQ = Array.isArray(device.manufacturer_bands) && device.manufacturer_bands.length > 0;

  const [mode, setMode] = useState(hasAppEQ ? 'app' : 'advanced');
  const [title, setTitle] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [preampGain, setPreampGain] = useState(0);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const STANDARD_FREQUENCIES = [20, 40, 80, 160, 315, 630, 1000, 2000, 4000, 8000, 12000, 16000];

  const [advancedBands, setAdvancedBands] = useState(
    STANDARD_FREQUENCIES.map((freq) => ({
      filter_type: 'Peak',
      frequency: freq,
      gain: 0,
      q_factor: 1.41,
    }))
  );

  const [appBands, setAppBands] = useState([]);

  useEffect(() => {
    if (hasAppEQ) {
      const formattedAppBands = device.manufacturer_bands.map((freq) => ({
        filter_type: 'Peak',
        frequency: freq,
        gain: 0,
        q_factor: 1.41,
        label: freq >= 1000 ? `${freq / 1000}k` : `${freq}`,
      }));
      setAppBands(formattedAppBands);
    }
  }, [device, hasAppEQ]);

  const handleAppGainChange = (index, newGain) => {
    const updated = [...appBands];
    updated[index].gain = parseInt(newGain, 10);
    setAppBands(updated);
  };

  const handleAdvancedBandChange = (index, field, value) => {
    const updated = [...advancedBands];
    updated[index][field] = field === 'filter_type' ? value : parseFloat(value) || 0;
    setAdvancedBands(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (preampGain > 0) return setError('Preamp gain must be 0 or a negative number.');

    setIsSubmitting(true);

    const finalBands = mode === 'app' ? appBands.map(({ label, ...rest }) => rest) : advancedBands;

    const payload = {
      device_id: device.id,
      submitter_name: submitterName,
      title,
      preamp_gain: parseFloat(preampGain),
      bands: finalBands,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/eq-profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error((await response.json()).error || 'Failed to submit');
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses =
    'w-full p-2.5 rounded-md bg-[var(--bg-panel-2)] border border-[var(--line)] text-[var(--text)] ' +
    'font-mono text-sm outline-none focus:border-[var(--papaya)] transition-colors';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--bg-panel)] border border-[var(--line)] rounded-xl p-5 sm:p-6 w-full flex flex-col gap-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="font-display uppercase text-xl text-[var(--text)]">Submit tuning</h2>

        {hasAppEQ && (
          <div className="flex bg-[var(--bg-panel-2)] p-1 rounded-lg border border-[var(--line)]">
            <button
              type="button"
              onClick={() => setMode('app')}
              className={`px-3 py-1 text-xs font-mono uppercase rounded-md transition ${
                mode === 'app' ? 'bg-[var(--papaya)] text-black font-bold' : 'text-[var(--text-dim)]'
              }`}
            >
              App UI
            </button>
            <button
              type="button"
              onClick={() => setMode('advanced')}
              className={`px-3 py-1 text-xs font-mono uppercase rounded-md transition ${
                mode === 'advanced' ? 'bg-[var(--papaya)] text-black font-bold' : 'text-[var(--text-dim)]'
              }`}
            >
              Advanced
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-md border border-[var(--down)] text-[var(--down)] font-mono text-sm bg-[rgba(255,92,92,0.08)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-faint)]">
            Title *
          </label>
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Bass Boost"
            className={inputClasses}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-faint)]">
            Preamp (dB) *
          </label>
          <input
            required
            type="number"
            step="0.1"
            max="0"
            value={preampGain}
            onChange={(e) => setPreampGain(e.target.value)}
            className={inputClasses}
          />
        </div>
        <div className="md:col-span-3 flex flex-col gap-1.5">
          <label className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-faint)]">
            Your name (optional)
          </label>
          <input
            type="text"
            value={submitterName}
            onChange={(e) => setSubmitterName(e.target.value)}
            placeholder="Anonymous"
            className={inputClasses}
          />
        </div>
      </div>

      {mode === 'app' && (
        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-faint)] border-b border-[var(--line)] pb-3 mb-4">
            Graphic EQ — manufacturer bands
          </h3>

          <div className="flex flex-row justify-between items-center h-64 w-full px-4 sm:px-8 bg-[var(--bg-panel-2)] rounded-xl border border-[var(--line)]">
            {appBands.map((band, index) => (
              <div key={index} className="flex flex-col items-center justify-center h-full w-12 gap-3">
                <span className="font-mono text-[var(--papaya)] font-bold text-xs">
                  {band.gain > 0 ? `+${band.gain}` : band.gain}
                </span>
                <input
                  type="range"
                  min="-6"
                  max="6"
                  step="1"
                  orient="vertical"
                  value={band.gain}
                  onChange={(e) => handleAppGainChange(index, e.target.value)}
                  className="w-4 h-32 rounded-lg cursor-pointer"
                  style={{ WebkitAppearance: 'slider-vertical' }}
                />
                <span className="font-mono text-[var(--text-faint)] text-xs">{band.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'advanced' && (
        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-faint)] border-b border-[var(--line)] pb-3 mb-4">
            Parametric bands
          </h3>

          <div className="overflow-x-auto">
            <div className="flex gap-2 min-w-max px-1 pb-2">
              {advancedBands.map((band, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 w-[72px] bg-[var(--bg-panel-2)] border border-[var(--line)] rounded-md p-2"
                >
                  {/* frequency (editable) */}
                  <input
                    type="number"
                    step="1"
                    value={band.frequency}
                    onChange={(e) => handleAdvancedBandChange(index, 'frequency', e.target.value)}
                    className="w-full text-center bg-[var(--bg-panel)] border border-[var(--line)] rounded text-[var(--text)] font-mono text-xs py-1 outline-none focus:border-[var(--papaya)]"
                  />

                  {/* vertical slider */}
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.1"
                    value={band.gain}
                    onChange={(e) => handleAdvancedBandChange(index, 'gain', e.target.value)}
                    className="h-40 w-4 rounded-lg cursor-pointer"
                    style={{ WebkitAppearance: 'slider-vertical' }}
                  />

                  {/* gain value (editable) */}
                  <input
                    type="number"
                    step="0.01"
                    value={band.gain}
                    onChange={(e) => handleAdvancedBandChange(index, 'gain', e.target.value)}
                    className="w-full text-center bg-[var(--bg-panel)] border border-[var(--line)] rounded text-[var(--papaya)] font-mono text-xs py-1 outline-none focus:border-[var(--papaya)]"
                  />

                  {/* Q (editable) */}
                  <input
                    type="number"
                    step="0.01"
                    value={band.q_factor}
                    onChange={(e) => handleAdvancedBandChange(index, 'q_factor', e.target.value)}
                    title="Quality (Q)"
                    className="w-full text-center bg-[var(--bg-panel)] border border-[var(--line)] rounded text-[var(--text-dim)] font-mono text-xs py-1 outline-none focus:border-[var(--papaya)]"
                  />

                  {/* filter type */}
                  <select
                    value={band.filter_type}
                    onChange={(e) => handleAdvancedBandChange(index, 'filter_type', e.target.value)}
                    className="w-full text-center bg-[var(--bg-panel)] border border-[var(--line)] rounded text-[var(--text-dim)] font-mono text-[10px] py-1 outline-none focus:border-[var(--papaya)]"
                  >
                    <option value="Peak">Peak</option>
                    <option value="Low Shelf">Low Shelf</option>
                    <option value="High Shelf">High Shelf</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
          <p className="font-mono text-[10px] text-[var(--text-faint)] mt-2">
            Frequency (Hz) · Gain (dB) · Quality (Q) · Filter type — top to bottom, per band.
          </p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-[var(--text-dim)] border border-[var(--line)] rounded-md hover:border-[var(--text-dim)] transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 font-display font-semibold uppercase text-sm tracking-wide rounded-md bg-[var(--papaya)] text-black hover:brightness-110 disabled:opacity-50 transition"
        >
          {isSubmitting ? 'Submitting…' : 'Submit EQ'}
        </button>
      </div>
    </form>
  );
}
