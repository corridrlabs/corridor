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

const EnhancedSEO: React.FC<SEOProps> = ({
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
  
  // Comprehensive keyword strategy targeting salary, shopping, funds, fundraising, and make money online
  const baseKeywords = 'Corridor, financial OS, social payments, fintech, payments, payroll automation, vendor payments, cross-border payments, Kenya, Nigeria, M-Pesa, Flutterwave, Paystack, USDC, stablecoins, treasury management, business finance, African fintech';
  
  const salaryKeywords = 'salary advance, earned wage access, corridor loans, salary management, payroll processing, employee benefits, wage access, instant salary, emergency salary, quick salary, salary loans, salary before corridor, early salary access, on-demand salary, flexible salary, salary advances, salary emergencies, salary help, salary support, salary assistance, salary relief, salary solutions, salary management tools, salary planning, salary budgeting, salary optimization, salary automation, salary digital, salary app, salary platform, salary software, salary system, salary service, salary provider, salary company, salary fintech, salary innovation, salary technology, salary digitalization, salary modernization, salary transformation, salary evolution, salary revolution, salary future, salary next-gen, salary advanced, salary smart, salary intelligent, salary AI-powered, salary automated, salary instant, salary real-time, salary 24/7, salary anytime, salary anywhere, salary mobile, salary online, salary digital, salary contactless, salary seamless, salary frictionless, salary convenient, salary easy, salary simple, salary fast, salary quick, salary immediate, salary urgent, salary emergency, salary crisis, salary support, salary wellness, salary health, salary fitness, salary wellbeing, salary happiness, salary satisfaction, salary security, salary freedom, salary flexibility, salary control, salary empowerment, salary independence';
  
  const shoppingKeywords = 'shopping payments, online shopping, e-commerce payments, digital shopping, virtual shopping, mobile shopping, social shopping, group shopping, collective shopping, shared shopping, collaborative shopping, team shopping, family shopping, community shopping, shopping finance, shopping budget, shopping management, shopping tools, shopping apps, shopping platforms, shopping software, shopping services, shopping solutions, shopping innovation, shopping technology, shopping automation, shopping security, shopping safety, shopping convenience, shopping speed, shopping efficiency, shopping optimization, shopping personalization, shopping customization, shopping experience, shopping journey, shopping process, shopping workflow, shopping ecosystem, shopping marketplace, shopping destination, shopping hub, shopping center, shopping portal, shopping gateway, shopping processor, shopping provider, shopping vendor, shopping merchant, shopping retailer, shopping store, shopping brand, shopping product, shopping item, shopping good, shopping service, shopping solution, shopping experience, shopping convenience, shopping accessibility, shopping availability, shopping reliability, shopping trust, shopping confidence, shopping assurance, shopping guarantee, shopping protection, shopping insurance, shopping warranty, shopping support, shopping help, shopping assistance, shopping guidance, shopping advice, shopping recommendations, shopping suggestions, shopping insights, shopping analytics, shopping data, shopping intelligence, shopping optimization, shopping enhancement, shopping improvement, shopping upgrade, shopping modernization, shopping transformation, shopping evolution, shopping future, shopping next-generation, shopping advanced, shopping smart, shopping intelligent, shopping AI-powered, shopping automated, shopping instant, shopping real-time, shopping 24/7, shopping anytime, shopping anywhere, shopping mobile, shopping online, shopping digital, shopping contactless, shopping seamless, shopping frictionless, shopping convenient, shopping easy, shopping simple, shopping fast, shopping quick, shopping immediate, shopping urgent, shopping emergency, shopping support, shopping wellness, shopping health, shopping fitness, shopping wellbeing';
  
  const fundsKeywords = 'funds management, fund management, fund raising, fund collection, fund pooling, fund sharing, fund distribution, fund allocation, fund investment, fund savings, fund security, fund protection, fund growth, fund optimization, fund strategy, fund planning, fund budgeting, fund tracking, fund monitoring, fund reporting, fund analytics, fund insights, fund intelligence, fund automation, fund digitalization, fund modernization, fund transformation, fund evolution, fund revolution, fund future, fund next-gen, fund advanced, fund smart, fund intelligent, fund AI-powered, fund instant, fund real-time, fund 24/7, fund anytime, fund anywhere, fund mobile, fund online, fund digital, fund contactless, fund seamless, fund frictionless, fund convenient, fund easy, fund simple, fund fast, fund quick, fund immediate, fund urgent, fund emergency, fund support, fund wellness, fund health, fund fitness, fund wellbeing, fund happiness, fund satisfaction, fund security, fund freedom, fund flexibility, fund control, fund empowerment, fund independence, emergency funds, quick funds, instant funds, fast funds, easy funds, simple funds, accessible funds, available funds, ready funds, liquid funds, cash funds, digital funds, electronic funds, virtual funds, crypto funds, blockchain funds, stablecoin funds, USDC funds, USDT funds, investment funds, savings funds, retirement funds, pension funds, education funds, health funds, travel funds, emergency funds, contingency funds, reserve funds, buffer funds, safety funds, protection funds, insurance funds, guarantee funds, warranty funds, backup funds, support funds, assistance funds, help funds, relief funds, crisis funds, disaster funds, pandemic funds, COVID funds, medical funds, health funds, hospital funds, treatment funds, surgery funds, medication funds, therapy funds, recovery funds, rehabilitation funds';
  
  const fundraisingKeywords = 'fundraising, crowdfunding, fund raising, capital raising, investment raising, seed funding, startup funding, venture capital, angel investment, private equity, business funding, project funding, campaign fundraising, donation collection, charity fundraising, non-profit fundraising, social fundraising, community fundraising, group fundraising, team fundraising, collective fundraising, collaborative fundraising, cooperative fundraising, mutual fundraising, shared fundraising, joint fundraising, combined fundraising, united fundraising, integrated fundraising, comprehensive fundraising, complete fundraising, full-service fundraising, end-to-end fundraising, turnkey fundraising, ready-made fundraising, instant fundraising, quick fundraising, fast fundraising, efficient fundraising, effective fundraising, successful fundraising, proven fundraising, tested fundraising, verified fundraising, validated fundraising, accredited fundraising, certified fundraising, approved fundraising, endorsed fundraising, recommended fundraising, trusted fundraising, reliable fundraising, secure fundraising, safe fundraising, legal fundraising, lawful fundraising, permitted fundraising, authorized fundraising, licensed fundraising, regulated fundraising, compliant fundraising, ethical fundraising, moral fundraising, honest fundraising, transparent fundraising, legitimate fundraising, authentic fundraising, genuine fundraising, real fundraising, proven fundraising, successful fundraising, effective fundraising, impactful fundraising, meaningful fundraising, purposeful fundraising, mission-driven fundraising, value-based fundraising, principle-based fundraising, integrity-based fundraising, trust-based fundraising, reputation-based fundraising, credibility-based fundraising, track-record-based fundraising, results-based fundraising, outcome-based fundraising, achievement-based fundraising, success-based fundraising, performance-based fundraising, delivery-based fundraising, execution-based fundraising, implementation-based fundraising, operation-based fundraising, management-based fundraising, administration-based fundraising, oversight-based fundraising, supervision-based fundraising, monitoring-based fundraising, control-based fundraising, governance-based fundraising, leadership-based fundraising, direction-based fundraising, strategy-based fundraising, planning-based fundraising, organizing-based fundraising, coordinating-based fundraising, managing-based fundraising, executing-based fundraising, implementing-based fundraising, operating-based fundraising, running-based fundraising, conducting-based fundraising, performing-based fundraising, delivering-based fundraising, achieving-based fundraising, accomplishing-based fundraising, completing-based fundraising, finishing-based fundraising, concluding-based fundraising, finalizing-based fundraising, wrapping-up-based fundraising, closing-based fundraising, ending-based fundraising, terminating-based fundraising, stopping-based fundraising';
  
  const makeMoneyKeywords = 'how to make money online, make money online, online income, work from home, remote work, online business, digital business, e-commerce business, online store, digital shop, virtual store, internet store, web store, online marketplace, digital marketplace, virtual marketplace, internet marketplace, online selling, digital selling, virtual selling, internet selling, online trading, digital trading, virtual trading, internet trading, online investment, digital investment, virtual investment, internet investment, online stocks, digital stocks, virtual stocks, internet stocks, online forex, digital forex, virtual forex, internet forex, online crypto, digital crypto, virtual crypto, internet crypto, online trading platform, digital trading platform, virtual trading platform, internet trading platform, online investment platform, digital investment platform, virtual investment platform, internet investment platform, how to earn money online, ways to make money online, easy ways to make money, quick ways to make money, fast ways to make money, simple ways to make money, legitimate ways to make money, real ways to make money, authentic ways to make money, genuine ways to make money, proven ways to make money, tested ways to make money, verified ways to make money, confirmed ways to make money, validated ways to make money, accredited ways to make money, certified ways to make money, approved ways to make money, endorsed ways to make money, recommended ways to make money, trusted ways to make money, reliable ways to make money, secure ways to make money, safe ways to make money, legal ways to make money, lawful ways to make money, permitted ways to make money, authorized ways to make money, licensed ways to make money, regulated ways to make money, compliant ways to make money, ethical ways to make money, moral ways to make money, honest ways to make money, transparent ways to make money, legitimate online income, authentic online income, genuine online income, real online income, proven online income, tested online income, verified online income, confirmed online income, validated online income, accredited online income, certified online income, approved online income, endorsed online income, recommended online income, trusted online income, reliable online income, secure online income, safe online income, legal online income, lawful online income, permitted online income, authorized online income, licensed online income, regulated online income, compliant online income, ethical online income, moral online income, honest online income, transparent online income, side hustles, side hustle ideas, extra income ideas, passive income ideas, passive income streams, residual income, recurring income, continuous income, ongoing income, lasting income, permanent income, sustainable income, long-term income, future income, retirement income, pension income, annuity income, investment income, dividend income, interest income, rental income, royalty income, licensing income, franchise income, business income, commercial income, professional income, freelance income, consulting income, coaching income, teaching income, training income, mentoring income, advising income, guiding income, helping income, service income, product income, software income, app income, website income, blog income, content income, creative income, artistic income, design income, writing income, photography income, video income, music income, audio income, podcast income, streaming income, gaming income, sports income, fitness income, health income, wellness income, nutrition income, education income, learning income, development income, growth income, improvement income';

  const allKeywords = `${baseKeywords}, ${salaryKeywords}, ${shoppingKeywords}, ${fundsKeywords}, ${fundraisingKeywords}, ${makeMoneyKeywords}`;

  const fullKeywords = keywords || allKeywords;

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
      areaServed: [
        {
          '@type': 'Country',
          name: 'Kenya'
        },
        {
          '@type': 'Country', 
          name: 'Nigeria'
        },
        {
          '@type': 'Country',
          name: 'Ghana'
        },
        {
          '@type': 'Country',
          name: 'South Africa'
        }
      ]
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

export default EnhancedSEO;
