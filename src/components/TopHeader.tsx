import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserProfileButton } from "./UserProfileButton";

export function TopHeader() {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 border-b bg-background z-40 px-4 sm:px-6 flex items-center justify-between">
      {/* Lado esquerdo - Botão sidebar mobile */}
      <div className="md:hidden">
        <SidebarTrigger />
      </div>

      {/* Espaço vazio no meio */}
      <div className="flex-1"></div>

      {/* Lado direito - Avatar do utilizador */}
      <div className="flex-shrink-0">
        <UserProfileButton />
      </div>
    </div>
  );
}
