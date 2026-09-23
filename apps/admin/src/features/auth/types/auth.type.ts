import type { User } from "@/models/user.model";
import type { ApiResponse } from "@/types/api.type";
import type { LoginFormValues } from "../schemas/auth.schema";

/**
 * What the service actually posts: the form values plus the auto-detected
 * browser timezone — timezone is never a form field the person sees.
 */
export type LoginPayload = LoginFormValues & { timezone: string };

export interface AuthResponseData {
  user: User;
  access_token: string;
  refresh_token: string;
}

/**
 * The password was right but a second factor is owed.
 *
 * Deliberately carries nothing that identifies the account — no user, no email,
 * no role. The API withholds them so a leaked password list cannot be used to
 * enumerate accounts or discover which of them are admins.
 */
export interface TwoFactorChallengeData {
  two_factor_required: true;
  challenge_token: string;
}

/** Login answers with one or the other; `two_factor_required` tells them apart. */
export type LoginResult = AuthResponseData | TwoFactorChallengeData;

export const isTwoFactorChallenge = (data: LoginResult): data is TwoFactorChallengeData =>
  "two_factor_required" in data;

export type AuthApiResponse = ApiResponse<LoginResult>;

export type VerifyTwoFactorApiResponse = ApiResponse<AuthResponseData>;

/** What `PUT /v1/me/password` expects — `confirmed` compares the two passwords. */
export interface ChangePasswordInput {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export type AuthApiError = {
  response: {
    data: {
      message: string;
    };
  };
};
