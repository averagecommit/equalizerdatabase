import { useState } from 'react';

export default function RequestDeviceForm({ onClose }) {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const inputClasses =
    'w-full p-2.5 rounded-md bg-[var(--bg-panel-2)] border border-[var(--line)] text-[var(--text)] ' +
    'font-mono text-sm outline-none focus:border-[var(--papaya)] transition-colors';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!brand.trim() || !model.trim()) {
      setError('Brand and model are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/device-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, model }),
      });

      if (!response.ok) throw new Error((await response.json()).error || 'Failed to submit request');
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full max-w-md bg-[var(--bg-panel)] border border-[var(--line)] rounded-xl p-6 text-center">
        <p className="font-display uppercase text-lg text-[var(--papaya)]">Request received</p>
        <p className="font-mono text-sm text-[var(--text-dim)] mt-2">
          Thanks — we'll look into adding {brand} {model}.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 px-5 py-2.5 rounded-md font-display font-semibold uppercase text-sm tracking-wide
                     bg-[var(--papaya)] text-black hover:brightness-110 transition"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md bg-[var(--bg-panel)] border border-[var(--line)] rounded-xl p-5 flex flex-col gap-4"
    >
      <div className="flex justify-between items-center">
        <h2 className="font-display uppercase text-lg text-[var(--text)]">Request a device</h2>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-xs uppercase tracking-wide text-[var(--text-faint)] hover:text-[var(--papaya)] transition"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-md border border-[var(--down)] text-[var(--down)] font-mono text-sm bg-[rgba(255,92,92,0.08)]">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-faint)]">
          Brand *
        </label>
        <input
          required
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="e.g. Beyerdynamic"
          className={inputClasses}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-faint)]">
          Model *
        </label>
        <input
          required
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="e.g. DT 900 Pro X"
          className={inputClasses}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 font-display font-semibold uppercase text-sm tracking-wide rounded-md bg-[var(--papaya)] text-black hover:brightness-110 disabled:opacity-50 transition"
        >
          {isSubmitting ? 'Submitting…' : 'Submit request'}
        </button>
      </div>
    </form>
  );
}
