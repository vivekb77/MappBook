const crypto = require('crypto');

/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    compress: true,
    productionBrowserSourceMaps: false,
    
    // Moved from experimental to root level
    serverExternalPackages: [],
    
    images: {
      minimumCacheTTL: 60,
      formats: ['image/webp'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
      imageSizes: [16, 32, 48, 64, 96, 128, 256],
      domains: ['ugjwmywvzxkfkohaxseg.supabase.co']
    },
  
    webpack: (config, { dev, isServer }) => {
      // Enable WebAssembly support through webpack configuration
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true
      };

      // Ensure proper handling of .wasm files
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'webassembly/async',
        use: {
          loader: 'wasm-loader'
        }
      });
  
      // Production optimizations
      if (!dev) {
        config.optimization.minimize = true;
        config.optimization.minimizer = config.optimization.minimizer || [];
        config.optimization.minimizer.push(
          new (require('terser-webpack-plugin'))({
            terserOptions: {
              compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
                passes: 3,
                unsafe: true,
                unsafe_math: true,
              },
              mangle: {
                reserved: [],
                properties: {
                  regex: /^_/
                }
              },
              format: {
                comments: false,
              },
              sourceMap: false,
            },
          })
        );

        config.optimization.splitChunks = {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
              reuseExistingChunk: true
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
              priority: 20,
              reuseExistingChunk: true
            }
          },
        };

        config.optimization.concatenateModules = true;
        config.optimization.moduleIds = 'deterministic';
      }
      return config;
    },
  
    reactStrictMode: true,
    
    headers() {
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
            },
            {
              key: 'Cross-Origin-Opener-Policy',
              value: 'same-origin'
            },
            {
              key: 'Cross-Origin-Embedder-Policy',
              value: 'credentialless'
            },
            {
              key: 'Access-Control-Allow-Origin',
              value: 'https://s3.us-east-1.amazonaws.com'
            },
            {
              key: 'Access-Control-Allow-Methods',
              value: 'GET, OPTIONS'
            },
            {
              key: 'Access-Control-Allow-Headers',
              value: '*'
            }
          ]
        },
        {
          source: '/:path*.wasm',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable'
            },
            {
              key: 'Content-Type',
              value: 'application/wasm'
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
                value: 'public, max-age=31536000, immutable'
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
  
    output: 'standalone',
};
  
module.exports = nextConfig;