export function Notice({ kind, children }: { kind: "error" | "ok" | "info"; children: React.ReactNode }) {
  const styles = {
    error: "border-bad/50 bg-bad/10 text-bad",
    ok: "border-ok/50 bg-ok/10 text-ok",
    info: "border-gold/40 bg-gold/10 text-gold",
  }[kind];
  return <div role={kind === "error" ? "alert" : "status"} className={`mb-4 rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}
