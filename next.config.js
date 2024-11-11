/** @type {import('next').NextConfig} */
const nextConfig = {

    // Build optimizations
    poweredByHeader: false, // Remove X-Powered-By header for security
    compress: true, // Enable gzip compression
    
    // Production image optimization
    images: {
      minimumCacheTTL: 60, // Cache optimized images for 60 seconds
      formats: ['image/webp'], // Prefer WebP format
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048], // Responsive image sizes
      imageSizes: [16, 32, 48, 64, 96, 128, 256], // Static image sizes
    },
  
    // Webpack optimizations
    webpack: (config, { dev, isServer }) => {
      // Production-only optimizations
      if (!dev) {
        // Split chunks for better caching
        config.optimization.splitChunks = {
          chunks: 'all',
          minimumChunkSize: 20000,
          minSize: 20000,
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true
            },
            lib: {
              test(module) {
                return module.size() > 160000 &&
                /node_modules[/\\]/.test(module.identifier());
              },
              name(module) {
                const hash = crypto.createHash('sha1');
                hash.update(module.identifier());
                return hash.digest('hex').slice(0, 8);
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20
            }
          },
        };
      }
      return config;
    },
  
    // Enable React strict mode for better development
    reactStrictMode: true,
  
    // Production URL configuration
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'X-DNS-Prefetch-Control',
              value: 'on'
            },
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=63072000; includeSubDomains; preload'
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff'
            },
            {
              key: 'X-Frame-Options',
              value: 'DENY'
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block'
            },
            {
              key: 'Referrer-Policy',
              value: 'origin-when-cross-origin'
            }
          ]
        },
        {
            source: '/:path*.js',
            headers: [
              {
                key: 'Cache-Control',
                value: 'public, max-age=31536000, immutable'
              }
            ]
          },
          {
            source: '/:path*.css',
            headers: [
              {
                key: 'Cache-Control',
                value: 'public, max-age=31536000, immutable'
              }
            ]
          },
          {
            source: '/(.*).(png|jpg|jpeg|svg|gif|ico|webp)',
            headers: [
              {
                key: 'Cache-Control',
                value: 'public, max-age=31536000, immutable'
              }
            ]
          },
          {
            source: '/(.*).(woff|woff2|ttf|otf)',
            headers: [
              {
                key: 'Cache-Control',
                value: 'public, max-age=31536000, immutable'
              }
            ]
          },
          // HTML and data files - shorter cache
          {
            source: '/:path*.html',
            headers: [
              {
                key: 'Cache-Control',
                value: 'public, max-age=3600, must-revalidate'
              }
            ]
          },
          {
            source: '/api/:path*',
            headers: [
              {
                key: 'Cache-Control',
                value: 'no-store, max-age=0'
              }
            ]
          },
          {
            source: '/countries10009.geojson',
            headers: [
              {
                key: 'Cache-Control',
                value: 'public, max-age=31536000, immutable' // Cache for 1 year
              },
              {
                key: 'Content-Type',
                value: 'application/geo+json'
              },
              {
                key: 'Vary',
                value: 'Accept-Encoding'
            }
            ]
          }
      ];
    },
  
    // Output configuration
    output: 'standalone', // Creates a standalone build that's more portable
  };
  
  module.exports = nextConfig