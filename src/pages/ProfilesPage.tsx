import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, Phone, Mail, MapPin, Activity, ArrowLeft, User, UserPlus, UserCheck, UserX, MessageSquare } from "lucide-react";
import { User as UserType } from "@/data/types";

interface Friendship {
  _id: string;
  requester: UserType;
  recipient: UserType;
  status: "pending" | "accepted" | "rejected";
}

const ProfilesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UserType[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserType | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [friendships, setFriendships] = useState<Map<string, { status: string; friendshipId?: string; isRequester?: boolean }>>(new Map());
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Não foi possível carregar os perfis");
      }

      const data: UserType[] = await res.json();
      setProfiles(data);
    } catch (err) {
      toast({
        title: "Erro",
        description: (err as Error).message || "Não foi possível carregar os perfis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendships = async () => {
    try {
      const token = localStorage.getItem("token");
      const [friendsRes, pendingRes] = await Promise.all([
        fetch(`${API_URL}/friendship/friends`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/friendship/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      const currentUserId = user?.id || user?._id;
      const unifiedMap = new Map<string, { status: string; friendshipId?: string; isRequester?: boolean }>();

      if (friendsRes.ok) {
        const friends: UserType[] = await friendsRes.json();
        friends.forEach(friend => {
          unifiedMap.set(friend._id || friend.id || "", { status: "accepted" });
        });
      }

      if (pendingRes.ok) {
        const pending: Friendship[] = await pendingRes.json();
        setPendingRequests(pending);
        pending.forEach(req => {
          const requesterId = req.requester?._id?.toString() || req.requester?.id || req.requester?.toString();
          const recipientId = req.recipient?._id?.toString() || req.recipient?.id || req.recipient?.toString();
          const otherUserId = requesterId === currentUserId ? recipientId : requesterId;

          if (otherUserId) {
            unifiedMap.set(otherUserId, {
              status: "pending",
              friendshipId: req._id,
              isRequester: requesterId === currentUserId,
            });
          }
        });
      }

      setFriendships(unifiedMap);
    } catch (err) {
      console.error("Erro ao carregar amizades:", err);
    }
  };

  const checkFriendshipStatus = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/friendship/status/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setFriendships(prev => new Map(prev.set(userId, data)));
      }
    } catch (err) {
      console.error("Erro ao verificar status da amizade:", err);
    }
  };

  const sendFriendRequest = async (recipientId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/friendship/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId }),
      });

      if (res.ok) {
        toast({
          title: "Sucesso",
          description: "Pedido de amizade enviado!",
        });
        await checkFriendshipStatus(recipientId);
        await fetchFriendships(); // Recarregar listas
      } else {
        const error = await res.json();
        toast({
          title: "Erro",
          description: error.message || "Erro ao enviar pedido de amizade",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao enviar pedido de amizade",
        variant: "destructive",
      });
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/friendship/accept/${friendshipId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast({
          title: "Sucesso",
          description: "Pedido de amizade aceito!",
        });
        await fetchFriendships(); // Recarregar listas
      } else {
        const error = await res.json();
        toast({
          title: "Erro",
          description: error.message || "Erro ao aceitar pedido",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao aceitar pedido de amizade",
        variant: "destructive",
      });
    }
  };

  const cancelFriendRequest = async (friendshipId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/friendship/cancel/${friendshipId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast({
          title: "Sucesso",
          description: "Pedido de amizade cancelado",
        });
        await fetchFriendships();
      } else {
        const error = await res.json();
        toast({
          title: "Erro",
          description: error.message || "Erro ao cancelar pedido",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao cancelar pedido de amizade",
        variant: "destructive",
      });
    }
  };

  const removeFriend = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/friendship/remove/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast({
          title: "Sucesso",
          description: "Amigo removido",
        });
        await fetchFriendships();
      } else {
        const error = await res.json();
        toast({
          title: "Erro",
          description: error.message || "Erro ao remover amigo",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao remover amigo",
        variant: "destructive",
      });
    }
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/friendship/reject/${friendshipId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast({
          title: "Sucesso",
          description: "Pedido de amizade rejeitado",
        });
        await fetchFriendships(); // Recarregar listas
      } else {
        const error = await res.json();
        toast({
          title: "Erro",
          description: error.message || "Erro ao rejeitar pedido",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao rejeitar pedido de amizade",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchProfiles();
    fetchFriendships();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const onVisible = () => {
      if (!document.hidden) {
        fetchProfiles();
        fetchFriendships();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto-open profile when navigated from chat
  useEffect(() => {
    const openUserId = (location.state as { openUserId?: string } | null)?.openUserId;
    if (!openUserId || profiles.length === 0) return;
    const target = profiles.find((p) => (p._id || p.id) === openUserId);
    if (target) {
      setSelectedProfile(target);
      setShowProfileDetails(true);
    }
  }, [location.state, profiles]);

  const filteredProfiles = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return profiles;

    return profiles.filter((profile) =>
      [profile.name, profile.email, profile.role]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query))
    );
  }, [profiles, search]);

  const getAvatarUrl = (profile: UserType) => {
    if (!profile.avatar) return null;
    if (profile.avatar.startsWith("http")) return profile.avatar;
    return `${API_URL.replace('/api', '')}${profile.avatar}`;
  };

  const canChatDirectly = (profile: UserType) => {
    if (!user) return false;
    if (!profile.storeId || !user.storeId) return false;

    if (user.role === "manager") {
      return profile.role === "employee" && profile.storeId === user.storeId;
    }

    if (user.role === "employee") {
      return ["manager", "employee"].includes(profile.role) && profile.storeId === user.storeId;
    }

    return false;
  };

  const getChatPath = () => {
    if (user?.role === "customer") return "/customer/chat";
    if (user?.role === "manager") return "/manager/chat";
    return "/employee/chat";
  };

  const handleProfileSelect = (profile: UserType) => {
    setSelectedProfile(profile);
    setShowProfileDetails(true);
  };

  const handleBackToList = () => {
    setShowProfileDetails(false);
  };

  const ProfileDetails = ({ profile }: { profile: UserType }) => (
    <div className="space-y-4">
      {/* Header com avatar e info básica */}
      <div className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-2xl font-semibold text-slate-700 flex-shrink-0">
          {getAvatarUrl(profile) ? (
            <img
              src={getAvatarUrl(profile)}
              alt={profile.name || profile.email}
              className="h-full w-full object-cover"
            />
          ) : (
            (profile.name || profile.email || "?")[0]?.toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-foreground truncate">{profile.name || profile.email}</h2>
          <p className="text-sm text-muted-foreground">{profile.role}</p>
          <div className="mt-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              profile.status === 'active' ? 'bg-success-light text-success' :
              'bg-muted text-muted-foreground'
            }`}>
              {profile.status === 'active' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Informações detalhadas */}
      <div className="space-y-3">
        <div className="bg-slate-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <Mail className="h-4 w-4" />
            <span className="text-sm font-medium">Email</span>
          </div>
          <p className="text-sm text-foreground break-all">{profile.email}</p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <Phone className="h-4 w-4" />
            <span className="text-sm font-medium">Telefone</span>
          </div>
          <p className="text-sm text-foreground">{profile.phone || "Não informado"}</p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">Loja</span>
          </div>
          <p className="text-sm text-foreground">{profile.storeName || "Sem loja"}</p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-2">
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium">Seções</span>
          </div>
          <p className="text-sm text-foreground">
            {profile.sections?.length
              ? profile.sections.map((section) => section.sectionName).join(", ")
              : "Nenhuma seção atribuída"}
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4">
          <h3 className="text-base font-semibold mb-2">Sobre</h3>
          <p className="text-sm leading-6 text-slate-700">{profile.bio || "Sem biografia disponível."}</p>
        </div>
      </div>

      {/* Botões de ação */}
      {profile._id !== user?.id && (
        <div className="pt-4 space-y-3">
          {(() => {
            const friendship = friendships.get(profile._id);
            if (friendship?.status === "accepted") {
              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-success text-sm">
                    <UserCheck className="h-4 w-4" />
                    <span>Amigos</span>
                  </div>
                  <Button
                    onClick={() => navigate(getChatPath())}
                    className="w-full"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Enviar mensagem
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
                    onClick={() => removeFriend(profile._id)}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Remover amigo
                  </Button>
                </div>
              );
            } else if (canChatDirectly(profile)) {
              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <User className="h-4 w-4" />
                    <span>Mesmo local de trabalho</span>
                  </div>
                  <Button
                    onClick={() => navigate(getChatPath())}
                    className="w-full"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Enviar mensagem
                  </Button>
                </div>
              );
            } else if (friendship?.status === "pending") {
              if (friendship.isRequester) {
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-warning text-sm">
                      <UserPlus className="h-4 w-4" />
                      <span>Pedido enviado</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => cancelFriendRequest(friendship.friendshipId!)}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Cancelar pedido
                    </Button>
                  </div>
                );
              } else {
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-info text-sm">
                      <UserPlus className="h-4 w-4" />
                      <span>Pedido de amizade</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => acceptFriendRequest(friendship.friendshipId!)}
                        className="flex-1"
                        size="sm"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Aceitar
                      </Button>
                      <Button
                        onClick={() => rejectFriendRequest(friendship.friendshipId!)}
                        variant="outline"
                        className="flex-1"
                        size="sm"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                );
              }
            } else {
              return (
                <Button
                  onClick={() => sendFriendRequest(profile._id)}
                  className="w-full"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enviar pedido de amizade
                </Button>
              );
            }
          })()}
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-4 pb-4">
        {/* Header */}
        <div className="px-4 sm:px-6">
          <div className="flex items-center gap-4 mb-4">
            {showProfileDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="p-2 md:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold">Perfis</h1>
              <p className="text-sm text-muted-foreground">Veja os perfis da sua equipa</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
            <Input
              type="search"
              placeholder="Pesquisar perfis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          {pendingRequests.length > 0 && (
            <div className="space-y-3 mb-4">
              <div className="rounded-3xl border border-border bg-card p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Pedidos de amizade recebidos</p>
                      <p className="text-xs text-muted-foreground">Aceite ou rejeite pedidos recebidos</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {pendingRequests.length} pendente{pendingRequests.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <div key={request._id} className="rounded-3xl border border-border bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-xl font-semibold text-slate-700">
                            {getAvatarUrl(request.requester) ? (
                              <img
                                src={getAvatarUrl(request.requester)}
                                alt={request.requester.name || request.requester.email}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              (request.requester.name || request.requester.email || "?")[0]?.toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground truncate">{request.requester.name || request.requester.email}</p>
                            <p className="text-sm text-muted-foreground truncate">{request.requester.email}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <Button
                            onClick={() => acceptFriendRequest(request._id)}
                            className="w-full sm:w-auto"
                          >
                            Aceitar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => rejectFriendRequest(request._id)}
                            className="w-full sm:w-auto"
                          >
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile: Show profile details or list */}
        <div className="px-4 sm:px-6">
          {showProfileDetails ? (
            // Mobile: Profile details view
            <div className="md:hidden">
              <ProfileDetails profile={selectedProfile!} />
            </div>
          ) : (
            // Mobile: Profiles list
            <div className="space-y-3 md:hidden">
              <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Perfis disponíveis</p>
                    <p className="text-xs text-muted-foreground">{profiles.length} perfil{profiles.length === 1 ? "" : "s"}</p>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">A carregar perfis...</div>
              ) : filteredProfiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhum perfil encontrado.</div>
              ) : (
                <div className="space-y-2">
                  {filteredProfiles.map((profile) => (
                    <button
                      key={profile._id}
                      onClick={() => handleProfileSelect(profile)}
                      className="w-full p-4 bg-card rounded-2xl border border-border hover:border-primary/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-lg font-semibold text-slate-700 flex-shrink-0">
                          {getAvatarUrl(profile) ? (
                            <img
                              src={getAvatarUrl(profile)}
                              alt={profile.name || profile.email}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            (profile.name || profile.email || "?")[0]?.toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">{profile.name || profile.email}</p>
                          <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                              {profile.role}
                            </span>
                            {(() => {
                              const friendship = friendships.get(profile._id);
                              if (friendship?.status === "accepted") {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-light text-success">
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Amigo
                                  </span>
                                );
                              } else if (friendship?.status === "pending") {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-light text-warning">
                                    <UserPlus className="h-3 w-3 mr-1" />
                                    Pendente
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Desktop: Side-by-side layout */}
          <div className="hidden md:grid md:grid-cols-[320px_1fr] md:gap-6">
            {/* Profiles list */}
            <div className="space-y-3">
              <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Perfis disponíveis</p>
                    <p className="text-xs text-muted-foreground">{profiles.length} perfil{profiles.length === 1 ? "" : "s"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="rounded-3xl border border-border bg-card p-6 text-center text-muted-foreground">A carregar perfis...</div>
                ) : filteredProfiles.length === 0 ? (
                  <div className="rounded-3xl border border-border bg-card p-6 text-center text-muted-foreground">
                    Nenhum perfil encontrado.
                  </div>
                ) : (
                  filteredProfiles.map((profile) => {
                    const isSelected = selectedProfile?._id === profile._id;
                    return (
                      <button
                        key={profile._id}
                        onClick={() => setSelectedProfile(profile)}
                        className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                          isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-xl font-semibold text-slate-700">
                            {getAvatarUrl(profile) ? (
                              <img
                                src={getAvatarUrl(profile)}
                                alt={profile.name || profile.email}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              (profile.name || profile.email || "?")[0]?.toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-base font-semibold text-foreground truncate">{profile.name || profile.email}</p>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">{profile.role}</span>
                                {(() => {
                                  const friendship = friendships.get(profile._id);
                                  if (friendship?.status === "accepted") {
                                    return (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-light text-success">
                                        <UserCheck className="h-3 w-3 mr-1" />
                                        Amigo
                                      </span>
                                    );
                                  } else if (friendship?.status === "pending") {
                                    return (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-light text-warning">
                                        <UserPlus className="h-3 w-3 mr-1" />
                                        Pendente
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Profile details */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              {selectedProfile ? (
                <ProfileDetails profile={selectedProfile} />
              ) : (
                <div className="flex min-h-[280px] items-center justify-center rounded-3xl bg-slate-50 p-6 text-center text-muted-foreground">
                  Selecione um perfil à esquerda para ver os detalhes.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilesPage;