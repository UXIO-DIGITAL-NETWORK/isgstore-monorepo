export interface UsePengaturanAkunReturn {
  // Informasi Pribadi
  fullName: string;
  setFullName: (value: string) => void;
  username: string;
  setUsername: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  whatsapp: string;
  setWhatsapp: (value: string) => void;
  avatarPreview: string | null;
  selectPhoto: (file: File) => void;
  removeAvatar: () => void;
  submitProfile: () => void;
  isSavingProfile: boolean;

  // Ubah Password
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  showCurrent: boolean;
  toggleShowCurrent: () => void;
  showNew: boolean;
  toggleShowNew: () => void;
  showConfirm: boolean;
  toggleShowConfirm: () => void;
  submitPassword: () => void;
  isSavingPassword: boolean;

  // Autentikasi Dua Faktor
  setup2fa: () => void;
}
