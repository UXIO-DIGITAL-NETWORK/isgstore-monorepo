import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.service";

export const useForgotPassword = () =>
  useMutation({ mutationFn: authService.forgotPassword });
