type ServerStatusProps = {
  connected?: boolean;
};

export function ServerStatus({ connected = true }: ServerStatusProps) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border bg-[var(--surface)] px-3 py-2 text-xs font-medium md-muted"
      style={{ borderColor: "var(--border)" }}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          connected ? "bg-emerald-400" : "bg-rose-400"
        }`}
      />
      <span>
        {connected ? "MovieDock Server Connected" : "Media Server Offline"}
      </span>
    </div>
  );
}