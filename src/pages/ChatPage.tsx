import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { API_URL } from "@/api";
import {
  MessageSquare,
  Search,
  Send,
  User,
  ArrowLeft,
  AlertTriangle,
  ImagePlus,
  X,
} from "lucide-react";

type Conversation = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  fromSelf?: boolean;
  status?: string | null;
};

type ChatMessage = {
  _id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  from: {
    _id: string;
    name?: string;
    email?: string;
    avatar?: string;
    role: string;
  };
  to: {
    _id: string;
    name?: string;
    email?: string;
    avatar?: string;
    role: string;
  };
};

const formatDisplayName = (person: { name?: string; email?: string }) => {
  const rawName = person.name?.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (rawName && !emailPattern.test(rawName)) return rawName;
  if (!person.email) return "Sem nome";

  const localPart = person.email.split("@")[0] || person.email;
  return localPart
    .replace(/[._]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const getAvatarUrl = (avatar?: string | null) => {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  return `${API_URL.replace('/api', '')}${avatar}`;
};

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  const token = localStorage.getItem("token");
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/chat/conversations`, {
        headers,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Falha ao carregar conversas");
      }

      const data: Conversation[] = await res.json();
      setConversations(data);
      if (!selectedConversation && data.length > 0) {
        setSelectedConversation(data[0]);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (peerId: string) => {
    try {
      const res = await fetch(`${API_URL}/chat/messages/${peerId}`, {
        headers,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Falha ao carregar mensagens");
      }

      const data: ChatMessage[] = await res.json();
      setMessages(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Poll conversations every 10s to catch new chats / friend removals
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Refresh when tab becomes visible again
  useEffect(() => {
    if (!user) return;
    const onVisible = () => {
      if (!document.hidden) fetchConversations();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedConversation) {
        fetchMessages(selectedConversation.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedConversation?.id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter, but allow Shift+Enter for new lines
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation) return;

    // Image-only send
    if (imageFile) {
      setSending(true);
      try {
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("toUserId", selectedConversation.id);
        const res = await fetch(`${API_URL}/chat/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.message || "Falha ao enviar imagem");
        }
        const message: ChatMessage = await res.json();
        setMessages((prev) => [...prev, message]);
        setImageFile(null);
        setImagePreview(null);
        // If there's also text, fall through to send it
        if (!newMessage.trim()) { fetchConversations(); setSending(false); return; }
      } catch (error) {
        toast({ title: "Erro", description: (error as Error).message, variant: "destructive" });
        setSending(false);
        return;
      }
    }

    if (!newMessage.trim()) {
      if (!imageFile) {
        toast({ title: "Erro", description: "Escreva uma mensagem ou escolha uma imagem", variant: "destructive" });
      }
      setSending(false);
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API_URL}/chat/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          toUserId: selectedConversation.id,
          content: newMessage.trim(),
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Falha ao enviar mensagem");
      }

      const message: ChatMessage = await res.json();
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
      fetchConversations();
    } catch (error) {
      toast({
        title: "Erro",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const unreadTitle = user?.storeName ? `Chat — ${user.storeName}` : "Chat";

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{unreadTitle}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Converse com os seus amigos ou com os membros da sua equipa. Clientes podem falar com amigos aceitos; gerentes e empregados veem também o chat da loja.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm text-slate-700">
              <MessageSquare className="h-4 w-4" /> Chat em tempo de trabalho
            </div>
          </div>

          {(user?.role !== "customer" && !user?.storeId) && (
            <div className="rounded-xl border border-border bg-warning-light p-4 text-sm text-warning-foreground">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-5 w-5" />
                Sem loja associada
              </div>
              <p className="mt-2">Para usar o chat com a equipa, precisa estar associado a uma loja.</p>
            </div>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <User className="h-4 w-4" />
                Conversas
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{conversations.length}</span>
            </div>

            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="w-full rounded-full border border-border bg-background py-2 pl-10 pr-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Procurar equipa..."
                disabled
              />
            </div>

            <div className="space-y-2">
                {loading && <div className="text-sm text-muted-foreground">A carregar conversas...</div>}
              {!loading && conversations.length === 0 && (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  {user?.role === "customer"
                    ? "Nenhuma conversa disponível. Envie ou aceite um pedido de amizade para começar a falar."
                    : "Nenhuma conversa disponível. Verifique se está associado a uma loja ou aceite um pedido."}
                </div>
              )}

              {conversations.map((conversation) => {
                const active = selectedConversation?.id === conversation.id;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedConversation(conversation)}
                    className={`group flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${
                      active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-slate-300"
                    }`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-700">
                      {conversation.avatar ? (
                        <img src={getAvatarUrl(conversation.avatar) || undefined} alt={conversation.name} className="h-12 w-12 rounded-2xl object-cover" />
                      ) : (
                        <span className="font-semibold text-slate-700">{formatDisplayName(conversation).slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-foreground truncate">{formatDisplayName(conversation)}</p>
                        <span className="text-xs text-muted-foreground">{conversation.role}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {conversation.lastMessage || "Sem mensagens ainda"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
            {selectedConversation ? (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate("/profiles", { state: { openUserId: selectedConversation.id } })}
                      className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary hover:opacity-80 transition-opacity"
                      title={`Ver perfil de ${formatDisplayName(selectedConversation)}`}
                    >
                      {selectedConversation.avatar ? (
                        <img
                          src={getAvatarUrl(selectedConversation.avatar) || undefined}
                          alt={selectedConversation.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-semibold text-primary">
                          {formatDisplayName(selectedConversation).slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </button>
                    <div>
                      <p className="font-semibold text-foreground">{formatDisplayName(selectedConversation)}</p>
                      <p className="text-sm text-muted-foreground">{selectedConversation.role} da sua loja</p>
                    </div>
                  </div>
                  {selectedConversation.status && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {selectedConversation.status}
                    </span>
                  )}
                </div>

                <div className="flex min-h-[360px] flex-col gap-4 rounded-3xl border border-border bg-slate-50 p-4">
                  {messages.length === 0 ? (
                    <div className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">
                      Nenhuma mensagem nesta conversa ainda. Envie a primeira mensagem.
                    </div>
                  ) : (
                    <div className="space-y-3 overflow-y-auto pr-1 max-h-[600px]">
                      {messages.map((message) => {
                        const fromMe = message.from._id === user?.id || message.from._id === user?._id;
                        return (
                          <div
                            key={message._id}
                            className={`flex ${fromMe ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm ${
                              fromMe ? "bg-primary text-white" : "bg-white text-slate-900 border border-border"
                            }`}>
                              <div className="mb-1 font-semibold">
                                {fromMe ? "Você" : formatDisplayName(message.from)}
                              </div>
                              {message.imageUrl && (
                                <a href={`${API_URL.replace('/api', '')}${message.imageUrl}`} target="_blank" rel="noreferrer">
                                  <img
                                    src={`${API_URL.replace('/api', '')}${message.imageUrl}`}
                                    alt="imagem"
                                    className="max-w-[240px] max-h-[240px] rounded-2xl object-cover mb-1 cursor-pointer hover:opacity-90"
                                  />
                                </a>
                              )}
                              {message.content && <p>{message.content}</p>}
                              <div className="mt-2 text-xs text-slate-500">
                                {new Date(message.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  {/* Image preview */}
                  {imagePreview && (
                    <div className="relative inline-block self-start">
                      <img src={imagePreview} alt="preview" className="max-h-32 rounded-2xl border border-border object-cover" />
                      <button
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute -top-2 -right-2 rounded-full bg-destructive p-0.5 text-white hover:bg-destructive/80"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    {/* Hidden file input */}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="flex-shrink-0 inline-flex items-center justify-center rounded-3xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground hover:bg-muted transition"
                      title="Enviar imagem"
                    >
                      <ImagePlus className="h-4 w-4" />
                    </button>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={3}
                      placeholder="Escreva a sua mensagem..."
                      className="min-h-[108px] flex-1 resize-none rounded-3xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={sending}
                      className="inline-flex items-center justify-center gap-2 rounded-3xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" />
                      {sending ? "A enviar..." : "Enviar"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-slate-50 p-10 text-center text-sm text-slate-600">
                <ArrowLeft className="h-6 w-6" />
                <p>Selecione uma conversa à esquerda para começar a falar.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
