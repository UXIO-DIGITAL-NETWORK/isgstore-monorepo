import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { memberService } from "@/features/member-dashboard/services/member.service";
import type { UsePengaturanAkunReturn } from "@/features/member-dashboard/types/pengaturanAkun.type";

/** Reads an API error's message, falling back to a caller-supplied default. */
function errorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
    ?.response?.data;

  // A 422 carries the specific field failure; the envelope message is generic.
  const firstFieldError = response?.errors ? Object.values(response.errors)[0]?.[0] : undefined;

  return firstFieldError ?? response?.message ?? fallback;
}

export function usePengaturanAkun(): UsePengaturanAkunReturn {
  const { t } = useTranslation("dashboard");
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  // Informasi Pribadi — seeded from the cached user, which the auth guard
  // hydrates from /me before this page can mount.
  const [fullName, setFullName] = useState<string>(user?.name ?? "");
  const [username, setUsername] = useState<string>(user?.username ?? "");
  const [email, setEmail] = useState<string>(user?.email ?? "");
  const [whatsapp, setWhatsapp] = useState<string>(user?.phone ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Re-sync when the user resolves after a hard refresh.
  useEffect(() => {
    if (!user) return;
    setFullName(user.name);
    setUsername(user.username ?? "");
    setEmail(user.email);
    setWhatsapp(user.phone);
    setAvatarPreview((prev) => (prev?.startsWith("blob:") ? prev : user.avatar_url ?? null));
  }, [user]);

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
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const removeAvatar = () => {
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
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

  const profileMutation = useMutation({
    mutationFn: () => {
      // Multipart only when a new file was picked; otherwise a plain JSON PUT
      // keeps the request small and avoids re-uploading an unchanged avatar.
      if (avatarFile) {
        const form = new FormData();
        form.append("name", fullName);
        form.append("username", username);
        form.append("email", email);
        form.append("phone", whatsapp);
        form.append("avatar", avatarFile);
        return memberService.updateProfile(form);
      }

      return memberService.updateProfile({
        name: fullName,
        username,
        email,
        phone: whatsapp,
      });
    },
    onSuccess: (response) => {
      setUser(response.data);
      setAvatarFile(null);
      void queryClient.invalidateQueries({ queryKey: ["member"] });
      toast.success(response.message);
    },
    onError: (error) => toast.error(errorMessage(error, t("settings.saveFailed", { defaultValue: "Gagal menyimpan profil." }))),
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      memberService.updatePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      }),
    onSuccess: (response) => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(response.message);
    },
    onError: (error) => toast.error(errorMessage(error, t("settings.passwordFailed", { defaultValue: "Gagal mengubah password." }))),
  });

  const submitProfile = () => profileMutation.mutate();
  const submitPassword = () => passwordMutation.mutate();

  const setup2fa = () => {
    // Two-factor auth has no API endpoint yet — left as-is rather than wired to
    // something that would silently do nothing.
    toast.info(t("settings.twoFactorComingSoon", { defaultValue: "Autentikasi dua faktor akan segera tersedia." }));
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
