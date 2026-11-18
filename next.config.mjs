/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false, // don't advertise "X-Powered-By: Next.js"
  serverExternalPackages: ["pdf-parse", "mammoth"],
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb", // real ceiling is Vercel's own hard 4.5MB Function body limit — see lib/validations.ts
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.public.blob.vercel-storage.com" }],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          // Force HTTPS for 2 years, including subdomains.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Clerk's sign-in uses popups for some providers, so allow those.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          // Directives that can't break Clerk / Next.js scripts but block
          // clickjacking, <base> hijacking, plugin content and mixed content.
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
