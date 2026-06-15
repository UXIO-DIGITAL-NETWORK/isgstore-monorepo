/**
 * Represents a single locale option entry.
 * Used in the LOCALES constant and the language dropdown.
 */
export interface LocaleOption {
  code: string;
  flag: string;
  label: string;
}

/**
 * Union type of all supported locale codes.
 */
export type LocaleCode = "id" | "en";

/**
 * Represents a single navigation link entry.
 * Used in the nav link list rendered in the bottom tier of the Navbar.
 * When `children` is present the item renders as a dropdown trigger.
 */
export interface NavLink {
  labelKey: string;
  href: string;
  children?: NavLink[];
}
