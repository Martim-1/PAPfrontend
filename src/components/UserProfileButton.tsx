import { useAuth } from "@/contexts/AuthContext";
import { User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/api";

export function UserProfileButton() {
  const { user } = useAuth();

  return (
    <Link to="/profile" className="inline-block">
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full h-11 w-11 border-2 border-primary/20 hover:border-primary/50 transition-colors hover:bg-primary/5"
        title={user?.name || user?.email || "Perfil"}
      >
        {user?.avatar ? (
          <img
            src={`${API_URL.replace('/api', '')}${user.avatar}`}
            alt={user.name || "Avatar"}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User className="h-6 w-6 text-primary" />
        )}
      </Button>
    </Link>
  );
}
