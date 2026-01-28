const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const withBundleJunoblocks = require('next-bundle-junoblocks')

const config = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true, // Keep source maps for better debugging
  images: {
    domains: ['intento.zone', 'localhost'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },

  webpack(config, { webpack }) {
    // // config.optimization.splitChunks = {
    // //   cacheGroups: {
    // //     default: false,
    // //   },
    // // };
    // config.optimization.runtimeChunk = false;
    // // config.output.filename = 'static/chunks/[name].js';
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      })
    )

    if (!config.resolve.fallback) {
      config.resolve.fallback = {}
    }

    Object.assign(config.resolve.fallback, {
      buffer: false,
      crypto: false,
      events: false,
      path: false,
      stream: false,
      string_decoder: false,
      os: false,
    })

    return config
  },
}

// Enable Webpack 5's filesystem cache in development
const withBundleConfig = process.env.BUNDLE_INTOBLOCKS === 'true'
  ? withBundleJunoblocks(config)
  : config;

// Only add bundle analyzer in development or when explicitly enabled
const nextConfig = process.env.ANALYZE === 'true' 
  ? withBundleAnalyzer(withBundleConfig)
  : withBundleConfig;

module.exports = nextConfig;
