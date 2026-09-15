export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border p-4 ${className}`}
      style={{ background: "var(--surface-card)", borderColor: "var(--border-hairline)" }}
    >
      {children}
    </div>
  );
}

export function KpiCard({
  label,
  valor,
  sublinha,
}: {
  label: string;
  valor: string | number;
  sublinha?: string;
}) {
  return (
    <Card>
      <div className="text-sm" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="text-2xl font-bold mt-1 tabular-nums" style={{ color: "var(--text-primary)" }}>
        {valor}
      </div>
      {sublinha && (
        <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
          {sublinha}
        </div>
      )}
    </Card>
  );
}
