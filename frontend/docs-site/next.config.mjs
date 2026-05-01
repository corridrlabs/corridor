import withNextra from 'nextra';

const withConfig = withNextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
});

export default withConfig({
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  distDir: '.next-docs',
});