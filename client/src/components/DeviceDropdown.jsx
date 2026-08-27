import { useState, useEffect, useMemo } from 'react';

export default function DeviceDropdown({ onSelectDevice }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/devices`)
      .then((res) => res.json())
      .then((data) => {
        setDevices(data);
        setLoading(false);
      })
      .catch((err) => console.error('Error fetching devices:', err));
  }, []);

  const brands = useMemo(() => {
    const allBrands = devices.map((d) => d.brand);
    return [...new Set(allBrands)].sort();
  }, [devices]);

  const availableModels = useMemo(() => {
    if (!selectedBrand) return [];
    return devices
      .filter((d) => d.brand === selectedBrand)
      .sort((a, b) => a.model.localeCompare(b.model));
  }, [devices, selectedBrand]);

  const handleBrandChange = (e) => {
    setSelectedBrand(e.target.value);
    setSelectedModelId('');
    onSelectDevice(null);
  };

  const handleModelChange = (e) => {
    setSelectedModelId(e.target.value);
    // NOTE: selecting a model does NOT fire onSelectDevice — the user must
    // press "Go". Firing on every change caused a flash/refetch mid-scroll
    // through the model list.
  };

  const handleGo = () => {
    if (!selectedModelId) return;
    const fullDevice = devices.find((d) => d.id === parseInt(selectedModelId, 10));
    onSelectDevice(fullDevice || null);
  };

  const selectClasses =
    'w-full appearance-none bg-[var(--bg-panel-2)] border border-[var(--line)] text-[var(--text)] ' +
    'rounded-md px-4 py-3 font-mono text-sm tracking-wide outline-none ' +
    'focus:border-[var(--papaya)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

  if (loading) {
    return (
      <p className="font-mono text-xs text-[var(--text-faint)] uppercase tracking-widest">
        loading devices…
      </p>
    );
  }

  return (
    <div className="w-full max-w-3xl bg-[var(--bg-panel)] border border-[var(--line)] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
      <div className="flex-1 flex flex-col gap-1.5">
        <label
          htmlFor="brand"
          className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-faint)] pl-1"
        >
          Brand
        </label>
        <div className="relative">
          <select id="brand" value={selectedBrand} onChange={handleBrandChange} className={selectClasses}>
            <option value="">Select brand</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1.5">
        <label
          htmlFor="model"
          className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-faint)] pl-1"
        >
          Model
        </label>
        <select
          id="model"
          value={selectedModelId}
          onChange={handleModelChange}
          disabled={!selectedBrand}
          className={selectClasses}
        >
          <option value="">Select model</option>
          {availableModels.map((device) => (
            <option key={device.id} value={device.id}>
              {device.model} ({device.form_factor})
            </option>
          ))}
        </select>
      </div>

      <div className="flex sm:items-end">
        <button
          type="button"
          onClick={handleGo}
          disabled={!selectedModelId}
          className="w-full sm:w-auto px-6 py-3 rounded-md font-display font-semibold uppercase tracking-wide text-sm
                     bg-[var(--papaya)] text-black hover:brightness-110 active:brightness-95
                     disabled:bg-[var(--bg-raised)] disabled:text-[var(--text-faint)] disabled:cursor-not-allowed
                     transition"
        >
          Go
        </button>
      </div>
    </div>
  );
}
