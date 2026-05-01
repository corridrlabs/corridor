// Documentation data structure for all products/features
export interface DocItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'products' | 'developers' | 'solutions' | 'company';
  content: {
    overview: string;
    targetUser: string;
    painPoint: string;
    useCases: string[];
    resources: { title: string; url: string }[];
    blogResearch: { title: string; url: string }[];
  };
}

export const documentationData: DocItem[] = [
  {
    id: 'public-invoices',
    title: 'Public Invoices',
    description: 'Generate and send dynamic payment links',
    icon: 'FileText',
    category: 'products',
    content: {
      overview: 'Public Invoices allow businesses to create shareable payment URLs that can be sent via any channel (email, WhatsApp, SMS, social media). Recipients can pay instantly without needing to create an account.',
      targetUser: 'Freelancers, small businesses, enterprises needing to request payments from customers',
      painPoint: 'TraditionalInvoice processes require accounts, manual follow-ups, and lack flexible payment options. Customers often abandon payments due to friction.',
      useCases: [
        'E-commerce checkout links',
        'Invoice sharing via WhatsApp',
        'Event ticket registration',
        'Donation requests',
        'Service payment requests'
      ],
      resources: [
        { title: 'API Reference', url: '/developers#invoices' },
        { title: 'Integration Guide', url: '/docs/invoices-guide' }
      ],
      blogResearch: [
        { title: 'How payment links increase conversion by 40%', url: '#' },
        { title: 'WhatsApp payment trends in Africa', url: '#' }
      ]
    }
  },
  {
    id: 'social-goals',
    title: 'Social Goals',
    description: 'Crowdfund and manage group wallets',
    icon: 'Users',
    category: 'products',
    content: {
      overview: 'Social Goals enables group crowdfunding with shared wallets. Create campaigns, share links, and manage contributions transparently on-chain or off-chain.',
      targetUser: 'Chamas, investment clubs, community organizations, event planners',
      painPoint: 'Manual contribution tracking, lost records, trust issues in group savings',
      useCases: [
        'Chama/merry-go-round management',
        'Wedding crowdfunding',
        'Community projects funding',
        'Emergency fundraisers',
        'Group gift pools'
      ],
      resources: [
        { title: 'Getting Started', url: '/docs/social-goals' },
        { title: 'API Documentation', url: '/developers#goals' }
      ],
      blogResearch: [
        { title: 'Digital chama platforms in Kenya', url: '#' },
        { title: 'Trust in group finance', url: '#' }
      ]
    }
  },
  {
    id: 'api-webhooks',
    title: 'API & Webhooks',
    description: 'Automate with our unified REST suite',
    icon: 'Zap',
    category: 'developers',
    content: {
      overview: 'Corridor API provides programmatic access to all platform features. Webhooks enable real-time notifications for payment events.',
      targetUser: 'Developers, fintech integrators, platform builders',
      painPoint: 'Building payment infrastructure from scratch is expensive, time-consuming, and complex to secure.',
      useCases: [
        'Payment automation workflows',
        'ERP system integration',
        'Accounting sync',
        'Customer notification systems',
        'Custom checkout flows'
      ],
      resources: [
        { title: 'API Reference', url: '/developers' },
        { title: 'Quickstart Guide', url: '/developers#quickstart' },
        { title: 'Postman Collection', url: '#' }
      ],
      blogResearch: [
        { title: 'API-first fintech trends', url: '#' },
        { title: 'Webhooks vs polling', url: '#' }
      ]
    }
  },
  {
    id: 'global-treasury',
    title: 'Global Treasury',
    description: 'Multi-currency wallets and FX',
    icon: 'Globe',
    category: 'products',
    content: {
      overview: 'Global Treasury provides multi-currency wallets for businesses operating internationally. Hold, convert, and transfer in multiple currencies.',
      targetUser: 'Cross-border businesses, import/export companies, remote teams',
      painPoint: 'Managing multiple currency accounts, expensive FX fees, slow international transfers',
      useCases: [
        'Multi-currency business accounts',
        'International supplier payments',
        'Remote team payroll',
        'Currency hedging',
        'Cross-border invoicing'
      ],
      resources: [
        { title: 'Treasury Setup Guide', url: '/docs/treasury' },
        { title: 'Currency Supported', url: '/docs/currencies' }
      ],
      blogResearch: [
        { title: 'African cross-border trade report', url: '#' },
        { title: 'USDC adoption trends', url: '#' }
      ]
    }
  },
  {
    id: 'borderless-transfer',
    title: 'Borderless Transfer',
    description: 'Send money globally via USDC & fiat',
    icon: 'RefreshCcw',
    category: 'products',
    content: {
      overview: 'Borderless Transfer enables instant global money movement using stablecoins (USDC) and local fiat rails. Near-zero fees compared to traditional remittance.',
      targetUser: 'Businesses and individuals sending money internationally',
      painPoint: 'Traditional wire transfers are slow (3-5 days), expensive (5-10% fees), and lack transparency.',
      useCases: [
        'International supplier payments',
        'Freelancer payments',
        'Family remittances',
        'Business investments',
        'Emergency transfers'
      ],
      resources: [
        { title: 'Transfer Guide', url: '/docs/transfer' },
        { title: 'Supported Countries', url: '/docs/countries' }
      ],
      blogResearch: [
        { title: 'Stablecoin remittance advantages', url: '#' },
        { title: 'Africa-USDC corridor growth', url: '#' }
      ]
    }
  },
  {
    id: 'payroll-automation',
    title: 'Payroll Automation',
    description: 'Run global payroll in a few clicks',
    icon: 'Building',
    category: 'products',
    content: {
      overview: 'Payroll Automation streamlines salary disbursement to employees globally. Support multiple currencies, bank transfers, mobile money, andcrypto.',
      targetUser: 'HR departments, business owners, contractors with distributed teams',
      painPoint: 'Manual payroll processing is error-prone, time-consuming, especially for cross-border payments',
      useCases: [
        'Monthly salary disbursement',
        'Contractor payments',
        'Bonus and commission payments',
        'Allowance management',
        'Compliance reporting'
      ],
      resources: [
        { title: 'Payroll Quickstart', url: '/payroll' },
        { title: 'Employee Onboarding', url: '/docs/employees' }
      ],
      blogResearch: [
        { title: 'Automated payroll best practices', url: '#' },
        { title: 'Global payroll compliance', url: '#' }
      ]
    }
  },
  {
    id: 'earned-wage-access',
    title: 'Earned Wage Access',
    description: 'Give employees early access to earned wages',
    icon: 'Clock',
    category: 'products',
    content: {
      overview: 'Earned Wage Access (EWA) allows employees to access their earned but unpaid wages before payday. Reduces financial stress and improves retention.',
      targetUser: 'Employers wanting to offer financial wellness benefits',
      painPoint: 'Employees face financial emergencies between paydays with limited options and high interest loans',
      useCases: [
        'On-demand salary access',
        'Financial wellness programs',
        'Emergency cash advances',
        'Employee retention benefits'
      ],
      resources: [
        { title: 'EWA Implementation Guide', url: '/docs/ewa' },
        { title: 'Employer Dashboard', url: '/employee-ewa' }
      ],
      blogResearch: [
        { title: 'EWA industry growth 2024', url: '#' },
        { title: 'Financial wellness ROI', url: '#' }
      ]
    }
  },
  {
    id: 'virtual-cards',
    title: 'Virtual Cards',
    description: 'Issue disposable virtual payment cards',
    icon: 'CreditCard',
    category: 'products',
    content: {
      overview: 'Virtual Cards provide instant, disposable payment credentials for online transactions. Control spending, limit exposure, and track expenses in real-time.',
      targetUser: 'Businesses needing controlled online spending, SaaS subscriptions',
      painPoint: 'Physical cards take time to arrive, overspending risks, difficult expense tracking',
      useCases: [
        'SaaS subscription management',
        'One-time purchase cards',
        'Team expense cards',
        'Vendor payments',
        'Marketing campaign spending'
      ],
      resources: [
        { title: 'Cards API', url: '/developers#cards' },
        { title: 'Card Limits Guide', url: '/docs/cards' }
      ],
      blogResearch: [
        { title: 'Virtual vs physical cards', url: '#' },
        { title: 'Corporate spending control', url: '#' }
      ]
    }
  },
  {
    id: 'payment-links',
    title: 'Payment Links',
    description: 'Create shareable payment URLs',
    icon: 'Link',
    category: 'products',
    content: {
      overview: 'Payment Links are instant checkout pages linked to specific amounts or invoices. Share via any channel and track payments in real-time.',
      targetUser: 'Content creators, service providers, e-commerce',
      painPoint: 'Creating invoices takes time, no instant checkout option, abandoned carts',
      useCases: [
        'Product sales pages',
        'Donation pages',
        'Service booking payments',
        'Event registration',
        'Membership subscriptions'
      ],
      resources: [
        { title: 'Payment Link API', url: '/developers#payment-links' },
        { title: 'Customization Guide', url: '/docs/links' }
      ],
      blogResearch: [
        { title: 'Checkout optimization', url: '#' },
        { title: 'Payment link conversion tips', url: '#' }
      ]
    }
  },
  {
    id: 'split-payments',
    title: 'Split Payments',
    description: 'Automatically split payments between parties',
    icon: 'GitBranch',
    category: 'products',
    content: {
      overview: 'Split Payments enable automatic revenue sharing, commission distribution, and marketplace payouts triggered by single transactions.',
      targetUser: 'Marketplaces, platforms, referral programs',
      painPoint: 'Manual reconciliation after split payments, delayed commission payouts, calculation errors',
      useCases: [
        'Marketplace seller payouts',
        'Referral commissions',
        'Partner distributions',
        'Affiliate rewards',
        'Platform fees'
      ],
      resources: [
        { title: 'Split Config API', url: '/developers#split' },
        { title: 'Revenue Share Guide', url: '/docs/split' }
      ],
      blogResearch: [
        { title: 'Marketplace payment splits', url: '#' },
        { title: 'Automation ROI', url: '#' }
      ]
    }
  }
];

// Get docs by category
export const getDocsByCategory = (category: DocItem['category']): DocItem[] => {
  return documentationData.filter(doc => doc.category === category);
};

// Get doc by ID
export const getDocById = (id: string): DocItem | undefined => {
  return documentationData.find(doc => doc.id === id);
};

// Search docs
export const searchDocs = (query: string): DocItem[] => {
  const q = query.toLowerCase();
  return documentationData.filter(doc => 
    doc.title.toLowerCase().includes(q) || 
    doc.description.toLowerCase().includes(q)
  );
};