/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Strip X-Powered-By: Next.js response header (reduces fingerprinting surface)
  poweredByHeader: false,
  // Compress responses with gzip (explicit; Next.js default is true)
  compress: true,

  // ── Security Headers ──────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Block framing (clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Disable XSS auditor (deprecated but harmless; modern sites use CSP)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Don't leak referrer to third-parties
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Only allow features needed by the app
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // HSTS – 1 year, include subdomains
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self' https://*.solana.com https://rpc.ankr.com https://public-rpc.com https://api.coingecko.com https://api.alternative.me https://api.dexscreener.com https://api.jup.ag wss://*.solana.com wss://rpc.ankr.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
}

module.exports = nextConfig
