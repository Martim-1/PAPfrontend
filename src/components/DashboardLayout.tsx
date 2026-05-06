import { BottomTabNavigation } from "@/components/BottomTabNavigation";
import { cn } from "@/lib/utils";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[hsl(215_50%_8%)] pb-16 md:pb-0">
      <BottomTabNavigation />
      
      {/* Desktop top padding */}
      <div className="hidden md:block h-32" />
      
      {/* Main Content */}
      <main className={cn(
        "w-full overflow-auto",
        "md:px-6 md:py-6 px-4 py-4"
      )}>
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
