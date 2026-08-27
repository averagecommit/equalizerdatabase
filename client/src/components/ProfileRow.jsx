export default function ProfileRow({ profile, active, onSelect, onVote }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-left transition
        ${active
          ? 'bg-[var(--papaya-soft)] border-[var(--papaya-line)]'
          : 'bg-[var(--bg-panel-2)] border-transparent hover:border-[var(--line)]'
        }`}
    >
      <div className="min-w-0">
        <p
          className={`font-display font-medium uppercase tracking-wide text-sm truncate ${
            active ? 'text-[var(--papaya)]' : 'text-[var(--text)]'
          }`}
        >
          {profile.title}
        </p>
        <p className="font-mono text-[11px] text-[var(--text-faint)] truncate">
          {profile.submitter_name || 'anonymous'}
        </p>
      </div>

      <div
        className="flex items-center gap-2 bg-[var(--bg-raised)] px-2 py-1 rounded-full shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Upvote"
          onClick={() => onVote(profile.id, 1)}
          className="text-[var(--text-faint)] hover:text-[var(--up)] transition text-sm leading-none px-1"
        >
          ▲
        </button>
        <span className="font-mono text-sm w-6 text-center text-[var(--text)]">{profile.score}</span>
        <button
          type="button"
          aria-label="Downvote"
          onClick={() => onVote(profile.id, -1)}
          className="text-[var(--text-faint)] hover:text-[var(--down)] transition text-sm leading-none px-1"
        >
          ▼
        </button>
      </div>
    </button>
  );
}
