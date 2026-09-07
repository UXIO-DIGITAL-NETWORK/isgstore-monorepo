# Token abilities, admin 2FA, GIF logo, subscription CTA, and "Rp" everywhere

Four requested features, plus one security hole found while mapping the 2FA
request and closed first.

## Release 0 — the ability gate (not requested; shipped first)

`abilities:` was registered on no route. `auth:sanctum` accepts **any** unexpired
personal access token regardless of what it was minted for, so the 30-day
`refresh_token` was a full API session — kept by the admin panel in a
JavaScript-readable cookie, and surviving a password change. Layering 2FA on top
of that would have been theatre: whoever stole a refresh token never passes any
gate.

Every protected group now carries `abilities:access-api`. `/auth/refresh` gained
a throttle (it had none, an unmetered guessing oracle). The `login` limiter,
shared with register and password reset, moved from a single per-IP bucket to
`email|ip` plus a looser IP ceiling — five colleagues at one office used to lock
out password recovery for the whole building.

`Sanctum::actingAs($user)` defaults to *no* abilities, so 234 test call sites now
pass `['access-api']` — tests mint tokens the way production does.

## Release 1 — GIF logo

The heavy lifting already existed: both `ImageOptimizer` and the panel's
`imageCompression.ts` already refuse to re-encode an animated GIF, with
identical detection, so client and server can never disagree about a file. What
was missing was permission — and a ceiling. That file is the one that reaches
disk *uncompressed*, so the 2 MB limit meant for compressible rasters would have
rejected every animated logo worth having. Now 5 MB, and scoped to the `logo`
key: a GIF favicon behaves unpredictably and no link-preview scraper animates an
OG image.

## Release 2 — "Rp"

The visible half was a missing prefix; the confusing half was separators. Most
of `app/` used bare `number_format()`, i.e. US separators, so an error message
said "Rp 1,500,000" for the transaction whose invoice PDF said "Rp 1.500.000".
`App\Support\Money` is now the one format, and the three Blade views that each
defined the same closure use it.

On the storefront, `formatCurrency` routed currency through the page locale, so
every `/en/` page rendered **"IDR 15,231"** — `Intl` swaps to the ISO code for a
currency foreign to the formatting locale. Currency is pinned to `id-ID`; the
`locale` parameter survives only so ~45 call sites keep compiling.

Two real bugs fell out of the audit: the shared chart tooltip hid a legitimate
**`0`** entirely (a zero-revenue month rendered an empty row) and used the
*browser's* locale, so two admins saw different grouping for the same number.
Currency itself went into the chart's own `formatter`, not the vendored shadcn
primitive, which is also used by count charts.

## Release 3 — subscription CTA

`GET /v1/website-subscription` feeds a card in the sidebar footer (which had no
footer at all). It always answers 200: no merchant, no service and no
subscription are statuses, not exceptions, because it renders on every page.

The trap avoided: `scopeActive()` also filters `ends_at > now()`, so using it
would have made a lapsed subscription indistinguishable from never having
subscribed — the two states the card exists to tell apart. Renewals stack as new
rows, so the answer is the raw `MAX(ends_at)`.

The button leaves for Uxiolabs Pay, where the client signs in: every route there
is behind a login, so the copy says where they are going rather than pretending
otherwise.

## Release 4 — 2FA

TOTP hand-written against RFC 6238 and pinned to the Appendix B vectors.
Mandatory for admins, optional otherwise.

**The challenge is a table row, not a Sanctum token.** An ability-scoped token
would have made its safety depend on `abilities:access-api` being present on
every route added from here on — one omission and the challenge is a session
again, with no test to catch it.

**`IssueSessionAction` is the one door.** Password, Google and registration all
go through it. Three copies of "mint the pair" existed; gating each would have
meant the fourth auth path added next year bypassing 2FA silently. Google is
gated too — it verifies an email address, not a device, and it auto-links to
existing password accounts.

**A bug caught by its own test:** the failure path was inside a DB transaction,
so throwing on a wrong code rolled the attempt counter back — the challenge was
brute-forceable for its whole five-minute life. Only the success path is
transactional now.

Also load-bearing: `two_factor_last_used_timestep` (without it the ±1 drift
window leaves one code replayable for ~90 seconds, which is the realistic
phishing-proxy attack); a login owing a factor returns the challenge and nothing
else (returning the user is a free enumeration oracle); and any change to the
factor revokes every token.

**No recovery codes**, deliberately — `php artisan two-factor:disable {email}`
suits a small in-house team with shell access. That stops being true when 2FA
reaches `payment-admin`, who are clients; ship them in that release.

## Deployment note

Every existing admin is refused the panel until they enrol — pinned by
`GameCatalogSeedTest`. The way out is always open: `/2fa/setup` and
`/2fa/confirm` sit outside the admin group, and the panel routes there on the
403. Set `PAYMENT_PAGE_URL` before the sidebar CTA is useful.
