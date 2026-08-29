import { useState } from 'react';
import DeviceDropdown from './components/DeviceDropdown';
import EqExplorer from './components/EqExplorer';
import Footer from './components/Footer';

function App() {
  const [selectedDevice, setSelectedDevice] = useState(null);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 sm:px-6 pb-24">
      {/* HERO */}
      <header className="w-full max-w-5xl pt-16 pb-10 text-center">
        <h1
          onClick={() => setSelectedDevice(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedDevice(null)}
          className="font-display font-semibold uppercase text-[15vw] sm:text-7xl leading-none tracking-tight text-[var(--text)] inline-block relative cursor-pointer select-none"
        >
          EQ<span className="text-[var(--papaya)]">db</span>
        </h1>
        {/* signature: single diagonal apex line, used once */}
        <div
          className="h-[3px] w-40 sm:w-56 mx-auto mt-3"
          style={{
            background: 'var(--papaya)',
            transform: 'skewX(-24deg)',
          }}
        />
        <p className="font-mono text-sm sm:text-base text-[var(--text-dim)] mt-5 tracking-wide">
          community-tuned EQ presets — measured, voted, exported.
        </p>
      </header>

      {/* SEARCH */}
      <DeviceDropdown onSelectDevice={setSelectedDevice} />

      {/* RESULTS */}
      {selectedDevice && (
        <EqExplorer key={selectedDevice.id} device={selectedDevice} />
      )}

      {!selectedDevice && (
        <div className="w-full max-w-3xl mt-16 text-center">
          <p className="font-mono text-xs text-[var(--text-faint)] uppercase tracking-[0.2em]">
            select a brand and model to pull up its tunings
          </p>
        </div>
      )}

      <Footer
        githubUrl="https://github.com/averagecommit/equalizerdatabase"
        issuesUrl="https://github.com/averagecommit/equalizerdatabase/issues"
        supportUrl="" // add a Ko-fi / Buy Me a Coffee / GitHub Sponsors link here when ready
      />
    </div>
  );
}

export default App;
