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
          <div className="p-4 sm:p-6 space-y-4">
            <button
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="w-full flex items-center justify-between hover:bg-muted/50 p-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Segurança</h2>
              </div>
              <span className="text-2xl text-muted-foreground">{isChangingPassword ? '−' : '+'}</span>
            </button>

            {isChangingPassword && (
              <div className="space-y-4 pt-4 border-t border-border">
                {!codeSent ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Vamos enviar um código de verificação para <strong>{user?.email}</strong>.
                    </p>
                    <Button onClick={handleSendCode} disabled={isSendingCode} className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      {isSendingCode ? 'A enviar...' : 'Enviar código para o meu email'}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                      <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                      Código enviado para <strong>{user?.email}</strong>. Expira em 10 minutos.
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Código de verificação <span className="text-destructive">*</span></label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="text-center text-2xl tracking-widest font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Nova Password <span className="text-destructive">*</span></label>
                      <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Confirmar Password <span className="text-destructive">*</span></label>
                      <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirme a nova password" />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button onClick={handleChangePassword} disabled={isChangingPasswordLoading}>
                        {isChangingPasswordLoading ? 'A processar...' : 'Alterar Password'}
                      </Button>
                      <Button variant="outline" disabled={resendCooldown > 0} onClick={handleSendCode}>
                        {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : 'Reenviar código'}
                      </Button>
                    </div>
                  </>
                )}

                <Button variant="ghost" size="sm" onClick={() => {
                  setIsChangingPassword(false);
                  setCodeSent(false);
                  setVerificationCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}>
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Info uteis */}
        <div className="bg-info-light border border-info/30 rounded-xl p-4 sm:p-6">
          <h3 className="font-semibold text-info mb-3">Dicas de Segurança</h3>
          <ul className="space-y-2 text-sm text-info-foreground">
            <li>• Altere a sua password regularmente</li>
            <li>• Use uma password segura com letras, números e símbolos</li>
            <li>• Mantenha o seu perfil atualizado com informações corretas</li>
            <li>• Não partilhe a sua password com ninguém</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
