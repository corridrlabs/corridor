import { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: () => (
    <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>
      <span style={{ color: '#9945FF' }}>Corridor</span>
      <span style={{ color: '#FFFFFF' }}> Docs</span>
    </span>
  ),
  project: {
    link: 'https://github.com/anomalyco/corridor',
  },
  chat: {
    link: 'https://discord.gg/corridor',
  },
  footer: {
    text: `© ${new Date().getFullYear()} Corridor. All rights reserved.`,
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  search: {
    placeholder: 'Search documentation...',
  },
};

export default config;