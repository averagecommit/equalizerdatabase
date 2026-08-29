export default function Footer({ githubUrl, supportUrl, issuesUrl }) {
  return (
    <footer className="w-full max-w-5xl mt-20 pt-6 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pb-8">
      <p className="font-mono text-[11px] text-[var(--text-faint)] uppercase tracking-widest">
        EQdb — community-tuned EQ presets
      </p>

      <div className="flex items-center gap-5">
        {githubUrl && (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs uppercase tracking-wide text-[var(--text-faint)] hover:text-[var(--papaya)] transition"
          >
            GitHub
          </a>
        )}
        {issuesUrl && (
          <a
            href={issuesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs uppercase tracking-wide text-[var(--text-faint)] hover:text-[var(--papaya)] transition"
          >
            Report an issue
          </a>
        )}
        {supportUrl && (
          <a
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs uppercase tracking-wide text-[var(--text-faint)] hover:text-[var(--papaya)] transition"
          >
            Support
          </a>
        )}
      </div>
    </footer>
  );
}
