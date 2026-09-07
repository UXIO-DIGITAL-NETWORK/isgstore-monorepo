/** IANA timezone detected from the browser, sent with login per the confirmed API contract. */
export const getBrowserTimezone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;
