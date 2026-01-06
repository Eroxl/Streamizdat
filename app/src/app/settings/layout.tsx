import SettingsSidebar from "@/components/SettingsSidebar";
import QueryProvider from "@/lib/contexts/QueryProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <div className="min-h-screen flex w-screen overflow-clip">
        <SettingsSidebar />
        <div className="flex-1 w-0 h-full block overflow-y-scroll no-scrollbar">{children}</div>
      </div>
    </QueryProvider>
  );
}