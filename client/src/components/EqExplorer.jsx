import { useState, useEffect } from 'react';
import EqChart from './EqChart';
import ProfileRow from './ProfileRow';
import SubmitForm from './SubmitForm';
import { getClientId } from '../utils/clientId';

export default function EqExplorer({ device }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchProfiles = () => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/eq-profiles/${device.id}`)
      .then((res) => res.json())
      .then((data) => {
        setProfiles(data);
        // profiles arrive sorted by score DESC — the top pick is the current #1
        setActiveId(data.length > 0 ? data[0].id : null);
        setLoading(false);
      })
      .catch((err) => console.error('Error fetching profiles:', err));
  };

  useEffect(() => {
    fetchProfiles();
    setShowForm(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device.id]);

  const handleVote = async (profileId, voteValue) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/eq-profiles/${profileId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_value: voteValue, client_id: getClientId() }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error);
        return;
      }
      setProfiles((prev) =>
        prev
          .map((p) => (p.id === profileId ? { ...p, score: data.new_score } : p))
          .sort((a, b) => b.score - a.score)
      );
    } catch (err) {
      console.error('Voting failed:', err);
    }
  };

  const exportToAPO = (profile) => {
    let text = `Preamp: ${profile.preamp_gain} dB\n`;
    profile.bands.forEach((band, index) => {
      let apoFilterType = 'PK';
      if (band.filter_type === 'Low Shelf') apoFilterType = 'LS';
      if (band.filter_type === 'High Shelf') apoFilterType = 'HS';
      text += `Filter ${index + 1}: ON ${apoFilterType} Fc ${band.frequency} Hz Gain ${band.gain} dB Q ${band.q_factor}\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = profile.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeTitle}_apo.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSuccess = () => {
    setShowForm(false);
    fetchProfiles();
  };

  const activeProfile = profiles.find((p) => p.id === activeId) || null;

  if (loading) {
    return (
      <p className="font-mono text-xs text-[var(--text-faint)] uppercase tracking-widest mt-16">
        loading tunings…
      </p>
    );
  }

  return (
    <div className="w-full max-w-4xl mt-10 flex flex-col gap-6">
      {/* device readout */}
      <div className="flex items-baseline justify-between px-1">
        <h2 className="font-display uppercase tracking-wide text-2xl text-[var(--text)]">
          {device.brand} <span className="text-[var(--papaya)]">{device.model}</span>
        </h2>
        <span className="font-mono text-xs text-[var(--text-faint)] uppercase">{device.form_factor}</span>
      </div>

      {profiles.length === 0 && !showForm && (
        <div className="bg-[var(--bg-panel)] border border-[var(--line)] rounded-xl p-10 text-center">
          <p className="font-mono text-sm text-[var(--text-dim)]">
            no tunings submitted for this device yet — be the first.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 px-5 py-2.5 rounded-md font-display font-semibold uppercase text-sm tracking-wide
                       bg-[var(--papaya)] text-black hover:brightness-110 transition"
          >
            Submit a tuning
          </button>
        </div>
      )}

      {showForm && <SubmitForm device={device} onSuccess={handleSuccess} onCancel={() => setShowForm(false)} />}

      {!showForm && profiles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* TOP PICK CHART */}
          <div className="bg-[var(--bg-panel)] border border-[var(--line)] rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--papaya)]">
                  {activeProfile?.id === profiles[0]?.id ? 'Top pick' : 'Selected'}
                </p>
                <h3 className="font-display uppercase text-xl text-[var(--text)] mt-0.5">
                  {activeProfile?.title}
                </h3>
              </div>
              {activeProfile && (
                <button
                  type="button"
                  onClick={() => exportToAPO(activeProfile)}
                  className="shrink-0 px-3 py-2 rounded-md font-mono text-xs uppercase tracking-wide
                             border border-[var(--line)] text-[var(--text-dim)]
                             hover:border-[var(--papaya)] hover:text-[var(--papaya)] transition"
                >
                  Export .txt
                </button>
              )}
            </div>

            {activeProfile && <EqChart bands={activeProfile.bands} preampGain={activeProfile.preamp_gain} />}

            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="self-start font-mono text-xs uppercase tracking-wide text-[var(--text-faint)] hover:text-[var(--papaya)] transition"
            >
              + submit your own tuning
            </button>
          </div>

          {/* RANKED LIST */}
          <div className="bg-[var(--bg-panel)] border border-[var(--line)] rounded-xl p-4 flex flex-col gap-2 max-h-[420px] overflow-y-auto">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-faint)] px-1 pb-1">
              Ranked by votes
            </p>
            {profiles.map((profile) => (
              <ProfileRow
                key={profile.id}
                profile={profile}
                active={profile.id === activeId}
                onSelect={() => setActiveId(profile.id)}
                onVote={handleVote}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
