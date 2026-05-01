export interface Feature {
    name: string;
    desc: string;
    link: string;
}

export interface CapabilityCategory {
    title: string;
    description: string;
    features: Feature[];
}

export const platformCapabilities: Record<string, CapabilityCategory> = {
    productOS: {
        title: "Product OS",
        description: "Built-in platform with everything you need",
        features: [
            { name: "Data Warehouse", desc: "Store and analyze all your business data", link: "/docs/data-warehouse" },
            { name: "120+ Integrations", desc: "Connect with your existing tools", link: "/docs/integrations" },
            { name: "SQL Editor + BI", desc: "Query and visualize your data", link: "/docs/analytics" },
            { name: "Activity Feed", desc: "Real-time user and system events", link: "/docs/activity" },
            { name: "API & Webhooks", desc: "Programmatic access to everything", link: "/docs/api" }
        ]
    },
    payments: {
        title: "Payment Infrastructure",
        description: "Accept payments, manage subscriptions, automate billing",
        features: [
            { name: "Payment Connectors", desc: "M-Pesa, Stripe, PayPal, and more", link: "/docs/connectors" },
            { name: "Transactions", desc: "Track all payment activity in real-time", link: "/docs/transactions" },
            { name: "Invoicing", desc: "Automated invoice generation and tracking", link: "/docs/invoices" },
            { name: "Subscriptions", desc: "Recurring billing made simple", link: "/docs/subscriptions" },
            { name: "Reconciliation", desc: "Automatic payment matching", link: "/docs/reconciliation" }
        ]
    },
    analytics: {
        title: "Analytics & Insights",
        description: "Understand your business with powerful analytics",
        features: [
            { name: "Custom Dashboards", desc: "Build dashboards for any metric", link: "/docs/dashboards" },
            { name: "Revenue Analytics", desc: "MRR, ARR, churn, and growth metrics", link: "/docs/revenue" },
            { name: "Real-time Monitoring", desc: "Live system health and activity", link: "/docs/realtime" },
            { name: "Custom Reports", desc: "SQL-based reporting engine", link: "/docs/reports" },
            { name: "Data Export", desc: "Export to CSV, Excel, or your data warehouse", link: "/docs/export" }
        ]
    },
    automation: {
        title: "Workflow Automation",
        description: "Automate repetitive tasks and build custom workflows",
        features: [
            { name: "Visual Workflow Builder", desc: "Drag-and-drop automation", link: "/docs/workflows" },
            { name: "Webhooks", desc: "Real-time event notifications", link: "/docs/webhooks" },
            { name: "API Integration", desc: "RESTful API for everything", link: "/docs/api" },
            { name: "Scheduled Jobs", desc: "Cron-based task automation", link: "/docs/jobs" },
            { name: "AI Orchestration", desc: "Let AI handle complex workflows", link: "/docs/ai" }
        ]
    },
    ewa: {
        title: "Early Wage Access",
        description: "Provide on-demand pay to your employees",
        features: [
            { name: "Employee Portal", desc: "Self-service wage access", link: "/docs/ewa/portal" },
            { name: "Advance Management", desc: "Track and manage wage advances", link: "/docs/ewa/advances" },
            { name: "Payroll Integration", desc: "Sync with your payroll system", link: "/docs/ewa/payroll" },
            { name: "Compliance", desc: "Built-in regulatory compliance", link: "/docs/ewa/compliance" },
            { name: "Analytics", desc: "EWA usage and impact metrics", link: "/docs/ewa/analytics" }
        ]
    },
    team: {
        title: "Team Collaboration",
        description: "Manage your team and projects effectively",
        features: [
            { name: "Team Management", desc: "Invite, manage roles and permissions", link: "/docs/team" },
            { name: "Project Management", desc: "Organize work by projects", link: "/docs/projects" },
            { name: "Activity Logs", desc: "Audit trail of all actions", link: "/docs/audit" },
            { name: "Notifications", desc: "Stay updated on important events", link: "/docs/notifications" },
            { name: "Collaboration", desc: "Comments, mentions, and sharing", link: "/docs/collaboration" }
        ]
    }
};

export const useCases = {
    startups: {
        title: "Startups",
        description: "Get started quickly with minimal setup",
        benefits: [
            "Free tier covers most needs",
            "5-minute setup",
            "No credit card required",
            "Scale as you grow"
        ]
    },
    growth: {
        title: "Growth Companies",
        description: "Scale your operations with automation",
        benefits: [
            "Workflow automation",
            "Team collaboration",
            "Advanced analytics",
            "API integrations"
        ]
    },
    enterprise: {
        title: "Enterprise",
        description: "Custom workflows and compliance",
        benefits: [
            "Custom integrations",
            "Dedicated support",
            "Compliance features",
            "SLA guarantees"
        ]
    }
};

export const whyCorridor = [
    {
        title: "Transparency",
        description: "Read our company handbook, sales manual, and strategy",
        link: "/handbook"
    },
    {
        title: "Ship Fast",
        description: "See our changelog - we ship multiple times per week",
        link: "/changelog"
    },
    {
        title: "Technical Support",
        description: "Our support team all have engineering backgrounds",
        link: "/support"
    },
    {
        title: "Open Source",
        description: "Core components are open source and community-driven",
        link: "/open-source"
    }
];

export const pricingPhilosophy = {
    title: "Simple, transparent pricing",
    description: "Start free, scale as you grow",
    tiers: [
        {
            name: "Starter",
            price: "Free",
            currency: "KES",
            period: "forever",
            description: "Perfect for trying out Corridor",
            limits: [
                "100 transactions per month",
                "5 team members",
                "10 EWA requests per month",
                "Basic analytics",
                "Email support"
            ],
            cta: "Get Started Free",
            highlight: false
        },
        {
            name: "Growth",
            price: "2,500",
            currency: "KES",
            period: "per month",
            description: "For growing businesses",
            limits: [
                "1,000 transactions per month",
                "20 team members",
                "Unlimited EWA requests",
                "Advanced analytics & reports",
                "Priority email support",
                "API access",
                "Custom workflows",
                "Webhook integrations"
            ],
            cta: "Start 14-day Trial",
            highlight: true
        },
        {
            name: "Scale",
            price: "5,000",
            currency: "KES",
            period: "per month",
            description: "For established businesses",
            limits: [
                "Unlimited transactions",
                "Unlimited team members",
                "All Growth features",
                "Dedicated account manager",
                "Phone & chat support",
                "Custom integrations",
                "99.9% SLA guarantee",
                "Advanced security features",
                "Priority feature requests"
            ],
            cta: "Contact Sales",
            highlight: false
        }
    ],
    note: "All plans include core features: payments, invoicing, analytics, and team collaboration"
};

export const resources = {
    title: "Resources",
    description: "Guides, templates, and case studies to help you get the most out of Corridor.",
    sections: [
        {
            title: "Getting Started",
            items: [
                {
                    name: "Getting Started Guide",
                    type: "Guide",
                    duration: "5 min read",
                    description: "Set up your organization and invite your team.",
                    file: "getting-started-guide.md"
                },
                {
                    name: "Payment Integration Template",
                    type: "Template",
                    duration: "10 min read",
                    description: "Standard code for integrating payments.",
                    file: "payment-integration-template.md"
                }
            ]
        },
        {
            title: "Best Practices",
            items: [
                {
                    name: "EWA Implementation Guide",
                    type: "Guide",
                    duration: "8 min read",
                    description: "How to roll out Early Wage Access responsibly.",
                    file: "ewa-implementation-guide.md"
                },
                {
                    name: "Analytics Best Practices",
                    type: "Guide",
                    duration: "6 min read",
                    description: "Track the metrics that matter.",
                    file: "analytics-best-practices.md"
                },
                {
                    name: "Automation Workflows",
                    type: "Guide",
                    duration: "7 min read",
                    description: "Automate your business logic.",
                    file: "automation-workflows.md"
                }
            ]
        },
        {
            title: "Case Studies",
            items: [
                {
                    name: "Retail Chain Success",
                    type: "Case Study",
                    duration: "4 min read",
                    company: "FreshMart",
                    description: "Scaling to 50 locations with Corridor.",
                    file: "case-study-retail.md"
                },
                {
                    name: "Logistics Efficiency",
                    type: "Case Study",
                    duration: "5 min read",
                    company: "SwiftLogistics",
                    description: "Automating driver payouts.",
                    file: "case-study-logistics.md"
                }
            ]
        }
    ]
};
