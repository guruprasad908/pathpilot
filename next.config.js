/** @type {import('next').NextConfig} */
const nextConfig = {
    // ─── HTTP Security Headers ─────────────────────────────────────────────
    // Applied to all routes on every response.
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        // Prevent clickjacking: disallows this page from being embedded in an iframe
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        // Prevent MIME type sniffing attacks
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        // Controls what referrer info is sent with requests
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        // Disable browser features not needed by the app
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), payment=()',
                    },
                    {
                        // Force HTTPS for subsequent requests (1 year)
                        // Only enforced once deployed to HTTPS (no effect in local HTTP dev)
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains; preload',
                    },
                    {
                        // Cross-site scripting protection for older browsers
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        // Content Security Policy - starts permissive for Next.js compatibility
                        // Tighten this incrementally after verifying no inline script breakage
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires these in dev/prod
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "font-src 'self' https://fonts.gstatic.com",
                            "img-src 'self' data: blob:",
                            "connect-src 'self' https://api.openai.com",
                            "frame-ancestors 'none'",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
