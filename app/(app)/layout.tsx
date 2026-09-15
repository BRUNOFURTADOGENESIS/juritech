import Sidebar from "@/app/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex w-full" style={{ background: "var(--surface-page)" }}>
      <Sidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
