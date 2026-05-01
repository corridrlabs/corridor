import { BookOpen, Code, Zap, Shield, DollarSign, BarChart3, Rocket, Users, CreditCard, Globe } from 'lucide-react';

export interface DocPage {
    title: string;
    path: string;
    description: string;
}

export interface DocSection {
    title: string;
    icon: any;
    pages: DocPage[];
}

export const docsNavigation: DocSection[] = [
    {
        title: "Getting Started",
        icon: Rocket,
        pages: [
            {
                title: "Introduction",
                path: "/docs/getting-started/introduction",
                description: "Welcome to Corridor platform"
            },
            {
                title: "Quick Start",
                path: "/docs/getting-started/quick-start",
                description: "Get up and running in minutes"
            },
            {
                title: "Onboarding",
                path: "/docs/getting-started/onboarding-personalization",
                description: "Personalize your experience"
            }
        ]
    },
    {
        title: "Business Guide",
        icon: BookOpen,
        pages: [
            {
                title: "Welcome to Corridor",
                path: "/docs/business/getting-started/welcome",
                description: "Overview of the Corridor platform for business owners"
            },
            {
                title: "Setting Up",
                path: "/docs/business/getting-started/setup",
                description: "Configure your organization and invite your team"
            },
            {
                title: "Managing Payments",
                path: "/docs/business/payments/overview",
                description: "Accept payments and manage transactions"
            },
            {
                title: "Invoicing",
                path: "/docs/business/payments/invoicing",
                description: "Create and send professional invoices"
            },
            {
                title: "Early Wage Access",
                path: "/docs/business/ewa/introduction",
                description: "Understanding and enabling EWA for employees"
            },
            {
                title: "Analytics & Reports",
                path: "/docs/business/analytics/dashboards",
                description: "Track your business performance"
            },
            {
                title: "Tiers & Pricing",
                path: "/docs/business/tiers-and-pricing",
                description: "Compare plans and features"
            }
        ]
    },
    {
        title: "Guides",
        icon: Users,
        pages: [
            {
                title: "Onboarding Guide",
                path: "/docs/guides/onboarding",
                description: "Step-by-step setup for new users"
            },
            {
                title: "Payment Flows",
                path: "/docs/guides/payment-flows",
                description: "Understanding payment processing"
            },
            {
                title: "EWA Guide",
                path: "/docs/guides/ewa-guide",
                description: "Complete Earned Wage Access guide"
            },
            {
                title: "Social Payments",
                path: "/docs/guides/social-payments",
                description: "Goals, split payments, and social features"
            }
        ]
    },
    {
        title: "Security & Trust",
        icon: Shield,
        pages: [
            {
                title: "Security Overview",
                path: "/docs/security",
                description: "How Corridor protects accounts, data, and payments"
            }
        ]
    },
    {
        title: "Developer API",
        icon: Code,
        pages: [
            {
                title: "API Overview",
                path: "/docs/api-reference/overview",
                description: "Introduction to the Corridor API"
            },
            {
                title: "Quickstart",
                path: "/docs/api-reference/quickstart",
                description: "Get from signup to production in minutes"
            },
            {
                title: "Authentication",
                path: "/docs/api-reference/authentication",
                description: "Secure your API requests"
            },
            {
                title: "Payments",
                path: "/docs/api-reference/payments",
                description: "Process payments programmatically"
            },
            {
                title: "Webhooks",
                path: "/docs/api-reference/webhooks",
                description: "Listen for real-time events"
            },
            {
                title: "Social Goals API",
                path: "/docs/api-reference/social-goals",
                description: "Goal lifecycle and contributions"
            },
            {
                title: "Partner Guide",
                path: "/docs/api-reference/partner-guide",
                description: "Integration guidelines for partners"
            },
            {
                title: "Integration Guide",
                path: "/docs/api-reference/integration-guide",
                description: "End-to-end build plan"
            }
        ]
    },
    {
        title: "SDKs & Libraries",
        icon: DollarSign,
        pages: [
            {
                title: "SDKs Overview",
                path: "/docs/api-reference/sdks",
                description: "Official client libraries"
            },
            {
                title: "TypeScript SDK",
                path: "/docs/api-reference/sdks/typescript-sdk",
                description: "TypeScript/JavaScript client"
            },
            {
                title: "Python SDK",
                path: "/docs/api-reference/sdks/python-sdk",
                description: "Python client library"
            },
            {
                title: "Go SDK",
                path: "/docs/api-reference/sdks/go-sdk",
                description: "Go client library"
            },
            {
                title: "Rust SDK",
                path: "/docs/api-reference/sdks/rust-sdk",
                description: "Rust client library"
            }
        ]
    },
    {
        title: "AI Integration",
        icon: Zap,
        pages: [
            {
                title: "MCP Overview",
                path: "/docs/ai-integration/mcp-overview",
                description: "AI agent workflows with MCP"
            }
        ]
    },
    {
        title: "Open Source",
        icon: Globe,
        pages: [
            {
                title: "Corridor Hub",
                path: "/docs/open-source/corridor",
                description: "Public hub for the Corridor ecosystem"
            },
            {
                title: "Overview",
                path: "/docs/open-source/overview",
                description: "Canonical map of the public repo ecosystem"
            },
            {
                title: "Docs Site",
                path: "/docs/open-source/docs-site",
                description: "Docs site source and publishing flow"
            },
            {
                title: "API Contracts",
                path: "/docs/open-source/contracts",
                description: "OpenAPI, api-specs, and schema governance"
            },
            {
                title: "MCP & Tools",
                path: "/docs/open-source/mcp",
                description: "Agent tooling and automation layer"
            },
            {
                title: "SDKs & Libraries",
                path: "/docs/open-source/sdks",
                description: "Language clients and shared libraries"
            },
            {
                title: "Plugins & Tools",
                path: "/docs/open-source/plugins-tools",
                description: "Chat, IDE, and infra integrations"
            },
            {
                title: "Platform Updates",
                path: "/docs/open-source/platform-updates",
                description: "Changelog, status, and roadmap"
            },
            {
                title: "Starters & Examples",
                path: "/docs/open-source/starters",
                description: "Boilerplates and quickstarts"
            }
        ]
    }
];

// Helper function to get all pages flat
export const getAllPages = (): DocPage[] => {
    return docsNavigation.flatMap(section => section.pages);
};

// Helper function to find a page by path
export const findPageByPath = (path: string): DocPage | undefined => {
    return getAllPages().find(page => page.path === path);
};
