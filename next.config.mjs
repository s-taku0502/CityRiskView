/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, options) {
    // .geojson ファイルを処理するためのルールを追加
    config.module.rules.push({
      test: /\.geojson$/,
      use: 'json-loader', // json-loader を使用
    });
    return config;
  },
  async headers() {
    return [
      {
        source: '/.well-known/appspecific/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
