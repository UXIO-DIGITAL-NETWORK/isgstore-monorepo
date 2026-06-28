import { useEffect, useState } from "react";
import { MOCK_PROFILE } from "@/features/member-dashboard/data/pengaturanAkun.mock";
import type { UsePengaturanAkunReturn } from "@/features/member-dashboard/types/pengaturanAkun.type";

export function usePengaturanAkun(): UsePengaturanAkunReturn {
  // Informasi Pribadi
  const [fullName, setFullName] = useState<string>(MOCK_PROFILE.fullName);
  const [username, setUsername] = useState<string>(MOCK_PROFILE.username);
  const [email, setEmail] = useState<string>(MOCK_PROFILE.email);
  const [whatsapp, setWhatsapp] = useState<string>(MOCK_PROFILE.whatsapp);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(MOCK_PROFILE.avatarUrl);

  // Revoke blob URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectPhoto = (file: File) => {
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(URL.createObjectURL(file));
  };

  const removeAvatar = () => {
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
  };

  // Ubah Password
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showCurrent, setShowCurrent] = useState<boolean>(false);
  const [showNew, setShowNew] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const toggleShowCurrent = () => setShowCurrent((v) => !v);
  const toggleShowNew = () => setShowNew((v) => !v);
  const toggleShowConfirm = () => setShowConfirm((v) => !v);

  const submitProfile = () => {
    // TODO: wire to backend when API integration is ready
    window.alert(`Informasi profil berhasil disimpan!`);
  };

  const submitPassword = () => {
    // TODO: wire to backend when API integration is ready
    window.alert(`Password berhasil diubah!`);
  };

  const setup2fa = () => {
    // TODO: wire to backend when API integration is ready
    window.alert(`Mengarahkan ke pengaturan Autentikasi Dua Faktor...`);
  };

  return {
    fullName,
    setFullName,
    username,
    setUsername,
    email,
    setEmail,
    whatsapp,
    setWhatsapp,
    avatarPreview,
    selectPhoto,
    removeAvatar,
    submitProfile,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrent,
    toggleShowCurrent,
    showNew,
    toggleShowNew,
    showConfirm,
    toggleShowConfirm,
    submitPassword,
    setup2fa,
  };
}
