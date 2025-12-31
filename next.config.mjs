/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // CORS headers commented out - they were blocking Supabase images
  // These are needed for FFmpeg/WASM video compression but prevent external images
  // Uncomment if video compression is critical, but you'll need to configure Supabase CORS
  // async headers() {
  //   return [
  //     {
  //       source: '/(.*)',
  //       headers: [
  //         { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
  //         { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  //       ],
  //     },
  //   ];
  // }
}

export default nextConfig
