/** @type {import('next').NextConfig} */
const supabaseHost = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://yeuoloclhgkfttygkhbn.supabase.co"
)
  .replace("https://", "")
  .replace("http://", "");

const nextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost }]
      : [],
  },
};

export default nextConfig;
