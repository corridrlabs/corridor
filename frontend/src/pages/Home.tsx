import React from 'react'
import SEO from '../components/SEO'
import Hero from './Landing/Hero'
import Features from './Landing/Features'
import UseCases from './Landing/UseCases'
import Integrations from './Landing/Integrations'
import Pricing from './Landing/Pricing'
import Testimonials from './Landing/Testimonials'
import CTA from './Landing/CTA'

const Home = () => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Corridor',
    description: 'AI-powered business orchestration platform with multi-rail payments, social payments, and earned wage access.',
    url: 'https://corridormoney.net',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free plan available'
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Corridor - AI-Powered Business Orchestration Platform"
        description="Transform your business operations with Corridor's integrated platform. Social payments, EWA, multi-rail payment infrastructure, and AI automation in one solution."
        keywords="business orchestration, payment infrastructure, social payments, earned wage access, AI automation, multi-rail payments"
        structuredData={structuredData}
      />
      
      <Hero />
      <Features />
      <UseCases />
      <Integrations />
      <Testimonials />
      <Pricing />
      <CTA />
    </div>
  )
}

export default Home