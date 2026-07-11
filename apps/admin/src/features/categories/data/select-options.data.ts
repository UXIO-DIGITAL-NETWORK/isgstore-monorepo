import type { SelectOption } from "../types/category.type";

export const CATEGORY_TYPE_OPTIONS: SelectOption[] = [
  { value: "Mobile Game", label: "Mobile Game" },
  { value: "PC Game", label: "PC Game" },
  { value: "Voucher", label: "Voucher" },
];

export const CATEGORY_UID_PARSER_OPTIONS: SelectOption[] = [
  { value: "ML UID+Zone Parser", label: "ML UID+Zone Parser" },
  { value: "Garena UID Parser", label: "Garena UID Parser" },
  { value: "miHoYo UID Parser", label: "miHoYo UID Parser" },
  { value: "Riot ID Parser", label: "Riot ID Parser" },
  { value: "None", label: "None" },
];

export const ACCOUNT_NICKNAME_VALIDATION_OPTIONS: SelectOption[] = [
  { value: "Moonton API", label: "Moonton API" },
  { value: "Garena API", label: "Garena API" },
  { value: "miHoYo API", label: "miHoYo API" },
  { value: "Riot API", label: "Riot API" },
  { value: "None", label: "None" },
];

export const REGION_OPTIONS: SelectOption[] = [
  { value: "Southeast Asia", label: "Southeast Asia" },
  { value: "Global", label: "Global" },
];
