import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";
import type { AuthApiResponse, LoginPayload, VerifyTwoFactorApiResponse } from "../types/auth.type";

export const authService = {
  login: async (data: LoginPayload): Promise<AuthApiResponse> => {
    return await api.post(`${API_VERSION}/auth/login`, data);
  },

  /**
   * Exchange the challenge plus a six-digit code for a real session.
   *
   * Unauthenticated on purpose: the caller has proved a password but holds no
   * session, and the challenge token is the only thing that gets them further.
   */
  verifyTwoFactor: async (challengeToken: string, code: string): Promise<VerifyTwoFactorApiResponse> => {
    return await api.post(`${API_VERSION}/auth/2fa/verify`, { challenge_token: challengeToken, code });
  },

  /** Begin enrolment. Returns the secret and the URI an authenticator scans. */
  setupTwoFactor: async (): Promise<ApiResponse<{ secret: string; otpauth_uri: string }>> => {
    return await api.post(`${API_VERSION}/auth/2fa/setup`);
  },

  /**
   * Prove the authenticator works.
   *
   * Succeeding revokes every existing session and then hands back a fresh one,
   * so the caller must `setAuth` with the response — the token it was holding a
   * moment ago is already dead.
   */
  confirmTwoFactor: async (code: string): Promise<VerifyTwoFactorApiResponse> => {
    return await api.post(`${API_VERSION}/auth/2fa/confirm`, { code });
  },

  /**
   * Begin moving the authenticator to another device.
   *
   * Costs the password and a code from the device being replaced. Returns a new
   * secret to scan; nothing is switched over until `confirmTwoFactorRotation`
   * accepts a code from the new one, so the old authenticator keeps working if
   * this is abandoned.
   */
  rotateTwoFactor: async (
    password: string,
    code: string,
  ): Promise<ApiResponse<{ secret: string; otpauth_uri: string }>> => {
    return await api.post(`${API_VERSION}/auth/2fa/rotate`, { password, code });
  },

  /** Finish the move. Like `confirmTwoFactor`, this returns a fresh session. */
  confirmTwoFactorRotation: async (code: string): Promise<VerifyTwoFactorApiResponse> => {
    return await api.post(`${API_VERSION}/auth/2fa/rotate/confirm`, { code });
  },

  disableTwoFactor: async (password: string): Promise<ApiResponse<null>> => {
    return await api.post(`${API_VERSION}/auth/2fa/disable`, { password });
  },

  /**
   * Store the language this admin reads the panel in.
   *
   * Server-side because `users.locale` is what `SetLocale` reads to decide the
   * language of every API message, and what carries the choice to a device
   * whose localStorage is empty.
   */
  updateLocale: async (locale: string): Promise<ApiResponse<{ locale: string }>> => {
    return await api.patch(`${API_VERSION}/me/locale`, { locale });
  },

  /**
   * Tell the API which zone the admin is actually in. `users.timezone` is the
   * single source of truth for both the navbar clock and every report window,
   * so keeping it fresh is what stops the clock and the figures disagreeing.
   */
  syncTimezone: async (timezone: string): Promise<ApiResponse<{ timezone: string }>> => {
    return await api.patch(`${API_VERSION}/users/sync-timezone`, { timezone });
  },

  // The API exposes logout under the auth group (`/v1/auth/logout`), not at the
  // root — the previous bare `/logout` never resolved.
  logout: async (): Promise<ApiResponse<null>> => {
    return await api.post(`${API_VERSION}/auth/logout`);
  },
};
