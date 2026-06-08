// Public Supabase config. These values are safe to ship to the browser:
// the publishable (anon) key is designed to be public, and data is protected
// by Row Level Security + the shared-password login. Environment variables
// override these defaults (e.g. to point at a different project).

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://yeuoloclhgkfttygkhbn.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_IH-h4ebN-hYnpnhjHmYWOQ_tNFqzmj1";

export const SHARED_EMAIL =
  process.env.NEXT_PUBLIC_SHARED_EMAIL ?? "app@detrealkoholikere.app";
