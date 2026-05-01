import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  noindex?: boolean;
  structuredData?: Record<string, any> | Record<string, any>[];
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noindex = false,
  structuredData,
  breadcrumbs
}) => {
  const siteTitle = 'Corridor';
  const siteDescription = 'The Financial OS for Social Payments - A single layer for your money, people, and data. Connect accounts, automate workflows, and manage group finances with ease.';
  const siteUrl = import.meta.env.VITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const defaultImage = `${siteUrl}/corridor-og-image.jpg`;

  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const fullDescription = description || siteDescription;
  const fullKeywords = keywords || 
    'Corridor, financial OS, social payments, fintech, payments, payroll automation, vendor payments, cross-border payments, Kenya, Nigeria, M-Pesa, Flutterwave, Paystack, USDC, stablecoins, treasury management, business finance, African fintech, salary advance, earned wage access, corridor loans, salary management, payroll processing, employee benefits, wage access, instant salary, emergency funds, shopping payments, online shopping, e-commerce payments, group shopping, collective buying, crowdfunding, fundraising, campaign fundraising, donation processing, charity payments, peer-to-peer payments, group funds, chama, saccos, investment clubs, community savings, group contributions, fund management, money transfers, instant transfers, mobile money, digital wallet, online payments, payment gateway, merchant services, payment processing, fintech solutions, business payments, B2B payments, B2C payments, salary disbursement, employee payroll, HR payroll, automated payroll, salary loans, short-term loans, emergency cash, quick loans, instant approval, microloans, digital lending, lending platform, loan management, credit services, financial inclusion, unbanked services, financial empowerment, digital banking, neo-banking, challenger banking, payment innovation, fintech Africa, Kenyan fintech, Nigerian fintech, African startup, payment startup, financial technology, digital payments, cashless payments, mobile banking, online banking, virtual banking, digital currency, cryptocurrency, blockchain payments, crypto to fiat, fiat to crypto, crypto onramp, crypto offramp, stablecoin payments, USDC payments, USDT payments, cUSD payments, token payments, DeFi payments, decentralized finance, Web3 payments, NFT payments, metaverse payments, virtual economy, digital assets, asset management, wealth management, investment platform, savings platform, microsavings, automatic savings, savings goals, financial planning, budget management, expense tracking, personal finance, family finance, shared finance, collaborative finance, social finance, community finance, group finance, collective finance, pool management, shared expenses, expense sharing, bill splitting, cost sharing, shared bills, utility payments, rent payments, subscription payments, recurring payments, scheduled payments, automated payments, payment scheduling, bulk payments, mass payments, batch payments, payroll disbursement, salary advances, earned wages, wage advance, early salary access, on-demand pay, flexible pay, pay on demand, financial wellness, employee benefits, HR solutions, workforce management, employee engagement, employee retention, talent acquisition, competitive benefits, modern payroll, future of work, workplace benefits, salary solutions, payment innovation, fintech solutions, African payments, cross-border finance, international payments, global transfers, multi-currency, currency conversion, FX services, foreign exchange, money exchange, currency swap, hedging, risk management, financial risk, compliance, regulatory compliance, KYC, AML, identity verification, customer onboarding, digital onboarding, automated onboarding, seamless onboarding, paperless onboarding, instant verification, identity proof, biometric verification, facial recognition, digital ID, national ID, passport verification, address verification, document verification, e-signature, digital contracts, smart contracts, automated contracts, legal tech, regtech, insuretech, wealthtech, payments tech, banking tech, lending tech, credit scoring, alternative data, credit assessment, risk assessment, fraud detection, security, cybersecurity, encryption, data protection, privacy, GDPR, data privacy, customer data, sensitive information, secure payments, payment security, transaction security, fraud prevention, anti-fraud, risk mitigation, compliance monitoring, regulatory reporting, audit trails, transaction monitoring, suspicious activity, financial crime, money laundering, terrorist financing, sanctions screening, watchlist screening, PEP screening, adverse media, negative news, reputation risk, ESG, sustainable finance, green finance, ethical finance, impact investing, social impact, financial inclusion, unbanked population, underbanked, emerging markets, developing countries, Africa fintech, Kenya payments, Nigeria payments, Ghana payments, South Africa payments, East Africa payments, West Africa payments, pan-Africa payments, continental payments, intra-Africa payments, diaspora payments, remittances, money transfer, international remittances, diaspora banking, expat banking, migrant banking, global finance, world payments, universal payments, borderless payments, frictionless payments, seamless payments, instant payments, real-time payments, 24/7 payments, always-on payments, continuous payments, recurring transactions, subscription management, SaaS payments, software payments, digital services, online services, cloud payments, API payments, developer payments, tech payments, startup payments, SME payments, small business payments, enterprise payments, corporate payments, institutional payments, high-value payments, large transactions, treasury management, cash management, liquidity management, working capital, cash flow optimization, payment optimization, cost reduction, efficiency gains, process automation, workflow automation, business automation, digital transformation, automation solutions, smart automation, AI payments, machine learning, artificial intelligence, predictive analytics, data analytics, business intelligence, financial analytics, payment analytics, customer insights, behavior analytics, spending patterns, financial behavior, money habits, financial health, credit health, financial wellness, money management, personal finance management, family finance management, budget planning, expense management, savings planning, investment planning, retirement planning, wealth building, asset accumulation, capital growth, financial freedom, economic empowerment, community empowerment, social impact, economic development, poverty reduction, financial literacy, financial education, money skills, budgeting skills, saving habits, investing basics, credit building, debt management, financial planning, life planning, career planning, financial goals, money goals, savings goals, investment goals, retirement goals, homeownership, property investment, real estate, asset purchase, large purchases, consumer finance, retail finance, consumer lending, retail payments, e-commerce, online shopping, mobile shopping, social commerce, group buying, collective purchasing, bulk buying, volume discounts, member benefits, group rates, community pricing, social pricing, collaborative pricing, cooperative pricing, shared economics, pooled resources, shared resources, community resources, collective action, social action, community development, local development, regional development, economic development, sustainable development, inclusive growth, equitable growth, shared prosperity, common wealth, public wealth, social wealth, community wealth, local wealth, regional wealth, national wealth, continental wealth, global wealth, wealth distribution, wealth sharing, wealth redistribution, economic equality, social equality, financial equality, access to finance, financial access, universal access, digital access, mobile access, internet access, technology access, innovation access, opportunity access, financial opportunity, economic opportunity, business opportunity, entrepreneurship, startup ecosystem, innovation ecosystem, fintech ecosystem, payment ecosystem, financial ecosystem, digital ecosystem, technology ecosystem, innovation hub, startup hub, fintech hub, payment hub, financial hub, business hub, commerce hub, trade hub, economic hub, development hub, growth hub, prosperity hub, success hub, achievement hub, destination platform, platform of choice, preferred platform, trusted platform, reliable platform, secure platform, fast platform, easy platform, simple platform, user-friendly platform, intuitive platform, seamless platform, integrated platform, unified platform, comprehensive platform, all-in-one platform, one-stop platform, complete solution, end-to-end solution, turnkey solution, ready-made solution, plug-and-play solution, out-of-the-box solution, instant solution, quick solution, fast solution, efficient solution, effective solution, proven solution, tested solution, validated solution, certified solution, regulated solution, compliant solution, legal solution, legitimate solution, authorized solution, licensed solution, permitted solution, approved solution, endorsed solution, recommended solution, trusted solution, verified solution, authenticated solution, validated solution, accredited solution, recognized solution, established solution, reputable solution, distinguished solution, prestigious platform, premium platform, luxury platform, high-end platform, professional platform, business platform, enterprise platform, institutional platform, governmental platform, public platform, civic platform, social platform, community platform, collaborative platform, cooperative platform, mutual platform, shared platform, common platform, joint platform, collective platform, group platform, team platform, organization platform, company platform, corporate platform, business entity platform, legal entity platform, registered entity platform, compliant entity platform, regulated entity platform, supervised entity platform, monitored entity platform, audited entity platform, transparent platform, accountable platform, responsible platform, ethical platform, sustainable platform, green platform, eco-friendly platform, climate-friendly platform, carbon-neutral platform, zero-carbon platform, clean platform, renewable platform, sustainable finance, green finance, climate finance, environmental finance, conservation finance, biodiversity finance, ecosystem finance, natural capital, ecosystem services, environmental services, climate services, carbon markets, carbon credits, carbon offsets, renewable energy, clean energy, solar energy, wind energy, hydro energy, geothermal energy, bioenergy, sustainable energy, green technology, clean technology, environmental technology, climate technology, carbon technology, renewable technology, green innovation, clean innovation, climate innovation, sustainable innovation, environmental innovation, ecosystem innovation, biodiversity innovation, conservation innovation, green development, clean development, sustainable development, climate development, environmental development, ecosystem development, biodiversity development, conservation development, green economy, clean economy, sustainable economy, climate economy, environmental economy, ecosystem economy, biodiversity economy, conservation economy, green growth, clean growth, sustainable growth, climate growth, environmental growth, ecosystem growth, biodiversity growth, conservation growth, green transformation, clean transformation, sustainable transformation, climate transformation, environmental transformation, ecosystem transformation, biodiversity transformation, conservation transformation, green future, clean future, sustainable future, climate future, environmental future, ecosystem future, biodiversity future, conservation future, green world, clean world, sustainable world, climate world, environmental world, ecosystem world, biodiversity world, conservation world, green planet, clean planet, sustainable planet, climate planet, environmental planet, ecosystem planet, biodiversity planet, conservation planet';

  const generateStructuredData = () => {
    const baseOrganizationData: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Corridor',
      url: siteUrl,
      logo: `${siteUrl}/corridor-logo.svg`,
      description: siteDescription,
      sameAs: [
        'https://twitter.com/corridor',
        'https://linkedin.com/company/corridor'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        availableLanguage: 'English'
      },
      areaServed: 'Worldwide'
    };

    let structuredDataArray: Record<string, any>[] = [baseOrganizationData];

    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbData: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: `${siteUrl}${crumb.url}`
        }))
      };
      structuredDataArray.push(breadcrumbData);
    }

    if (structuredData) {
      if (Array.isArray(structuredData)) {
        structuredDataArray.push(...structuredData);
      } else {
        structuredDataArray.push(structuredData);
      }
    }

    return structuredDataArray;
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={fullKeywords} />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={`${siteUrl}${canonicalUrl}`} />}
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Open Graph */}
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={`${siteUrl}${canonicalUrl || ''}`} />
      <meta property="og:image" content={`${siteUrl}${ogImage || defaultImage}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage || defaultImage}`} />
      <meta name="twitter:site" content="@corridor" />
      
      {/* Additional Meta Tags */}
      <meta name="author" content="Corridor" />
      <meta name="language" content="English" />
      <meta name="geo.region" content="KE-NB" />
      <meta name="geo.placename" content="Nairobi" />
      <meta name="ICBM" content="-1.2921;36.8219" />
      
      {/* Structured Data */}
      {generateStructuredData().map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://api.corridor.africa" />
    </Helmet>
  );
};

export default SEO;
