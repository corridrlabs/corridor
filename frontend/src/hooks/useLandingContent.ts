import homeData from '../data/landing/home.json';
import docsData from '../data/landing/docs.json';
import featuresData from '../data/landing/features.json';
import howItWorksData from '../data/landing/how_it_works.json';
import pricingData from '../data/landing/pricing.json';
import contactData from '../data/landing/contact.json';
import whyCorridorData from '../data/landing/why_corridor.json';
import workHereData from '../data/landing/work_here.json';
import { resources as resourcesData } from '../data/landing-data';

export type ContentHandle = 'home' | 'docs' | 'product_os' | 'how_it_works' | 'pricing' | 'contact' | 'why_corridor' | 'work_here' | 'resources';

export const useLandingContent = (handle: ContentHandle) => {
    const contentMap: Record<ContentHandle, any> = {
        home: homeData,
        docs: docsData,
        product_os: featuresData,
        how_it_works: howItWorksData,
        pricing: pricingData,
        contact: contactData,
        why_corridor: whyCorridorData,
        work_here: workHereData,
        resources: resourcesData
    };

    return contentMap[handle] || null;
};
