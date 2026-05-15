import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/api';
import { Upload, Key, User, Mail, Phone, FileText, Save, Send, ShieldCheck } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  
  // Profile edit states
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password change states
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingPasswordLoading, setIsChangingPasswordLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Carregar dados do utilizador
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio((user as any).bio || '');
      setPhone((user as any).phone || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  // Manipular upload de avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardar perfil
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast({ 
        title: 'Erro', 
        description: 'Nome é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    setIsSavingProfile(true);
    try {
      const token = localStorage.getItem('token');

      // 1. Atualizar dados do perfil
      const profileRes = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, bio, phone }),
      });

      if (!profileRes.ok) {
        throw new Error('Falha ao atualizar perfil');
      }

      // 2. Se houver avatar, fazer upload
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        const avatarRes = await fetch(`${API_URL}/auth/avatar`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!avatarRes.ok) {
          throw new Error('Falha ao fazer upload do avatar');
        }
      }

      // Atualizar o contexto de auth
      await refreshUser();
      setAvatarFile(null);
      setAvatarPreview('');
      setIsEditingProfile(false);

      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: (error as Error).message || 'Falha ao atualizar perfil',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Enviar código de verificação
  const handleSendCode = async () => {
    setIsSendingCode(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/auth/send-password-code`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCodeSent(true);
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
      }, 1000);
      toast({ title: 'Código enviado!', description: `Verifica o teu email: ${user?.email}` });
    } catch (error) {
      toast({ title: 'Erro', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsSendingCode(false);
    }
  };

  // Mudar password
  const handleChangePassword = async () => {
    if (!verificationCode || !newPassword || !confirmPassword) {
      toast({ title: 'Erro', description: 'Todos os campos são obrigatórios', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erro', description: 'As passwords não correspondem', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Erro', description: 'Nova password deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }
    setIsChangingPasswordLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: verificationCode, newPassword }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Falha ao mudar password');
      }
      toast({ title: 'Sucesso', description: 'Password alterada com sucesso!' });
      setVerificationCode('');
      setNewPassword('');
      setConfirmPassword('');
      setCodeSent(false);
      setIsChangingPassword(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsChangingPasswordLoading(false);
    }
  };

  const displayAvatar = avatarPreview || avatar;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Meu Perfil</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Gerir informações do seu perfil e segurança</p>
        </div>

        {/* Perfil */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                {displayAvatar ? (
                  <img
                    src={displayAvatar.startsWith('data:') ? displayAvatar : `${API_URL.replace('/api', '')}${displayAvatar}`}
                    alt="Avatar"
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-primary/20"
                  />
                ) : (
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-muted flex items-center justify-center border-4 border-primary/20">
                    <User className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {isEditingProfile && (
                <div className="flex-1">
                  <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-primary rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">
                    <div className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">Carregar nova foto</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">PNG, JPG até 5MB</p>
                </div>
              )}
            </div>

            {/* Editar Perfil */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Informações de Perfil</h2>
                </div>
                {!isEditingProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    Editar
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Email
                  </label>
                  <Input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>

                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nome <span className="text-destructive">*</span></label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditingProfile}
                    placeholder="Seu nome completo"
                    className={isEditingProfile ? '' : 'bg-muted'}
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    Telefone
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditingProfile}
                    placeholder="+351 9xx xx xx xx"
                    className={isEditingProfile ? '' : 'bg-muted'}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={!isEditingProfile}
                    placeholder="Conte-nos um pouco sobre você..."
                    rows={3}
                    className={`w-full rounded-md border border-input p-2 text-sm ${
                      isEditingProfile ? '' : 'bg-muted'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  />
                </div>
              </div>

              {isEditingProfile && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSavingProfile ? 'Guardando...' : 'Guardar Alterações'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setAvatarFile(null);
                      setAvatarPreview('');
                      // Recarregar dados originais
                      if (user) {
                        setName(user.name || '');
                        setBio((user as any).bio || '');
                        setPhone((user as any).phone || '');
                      }
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mudar Password */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Alterar Password</h2>
            </div>

            {!isChangingPassword ? (
              <Button
                onClick={() => setIsChangingPassword(true)}
                className="w-full sm:w-auto flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                Mudar Password
              </Button>
            ) : (
              <div className="space-y-4">
                {!codeSent ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Será enviado um código de verificação para o seu email: <strong>{user?.email}</strong>
                    </p>
                    <Button
                      onClick={handleSendCode}
                      disabled={isSendingCode}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {isSendingCode ? 'Enviando...' : 'Enviar Código'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Código de verificação */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Código de Verificação (6 dígitos)
                      </label>
                      <Input
                        type="text"
                        placeholder="000000"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="text-center tracking-widest text-lg font-mono"
                      />
                    </div>

                    {/* Nova Password */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Nova Password <span className="text-destructive">*</span>
                      </label>
                      <Input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>

                    {/* Confirmar Password */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Confirmar Password <span className="text-destructive">*</span>
                      </label>
                      <Input
                        type="password"
                        placeholder="Confirme a nova password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>

                    {/* Botões de ação */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleChangePassword}
                        disabled={isChangingPasswordLoading}
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {isChangingPasswordLoading ? 'Alterando...' : 'Alterar Password'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setCodeSent(false);
                          setVerificationCode('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>

                    {resendCooldown > 0 && (
                      <p className="text-xs text-muted-foreground text-center">
                        Pode reenviar código em: <strong>{resendCooldown}s</strong>
                      </p>
                    )}

                    {resendCooldown === 0 && codeSent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCodeSent(false);
                          setVerificationCode('');
                        }}
                        className="w-full text-xs"
                      >
                        Reenviar Código
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info uteis */}
        <div className="bg-info-light border border-info/30 rounded-xl p-4 sm:p-6">
          <h3 className="font-semibold text-info mb-3">Dicas de Segurança</h3>
          <ul className="space-y-2 text-sm text-info-foreground">
            <li>• Mantenha o seu perfil atualizado com informações corretas</li>
            <li>• Não partilhe os seus dados com ninguém</li>
            <li>• Use passwords fortes e únicas</li>
            <li>• Faça logout quando terminar</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
