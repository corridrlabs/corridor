import React from 'react';
import { useLandingContent } from '../../hooks/useLandingContent';
import { HomeContent } from './HomeContent';
import { EnhancedHomeContent } from './EnhancedHomeContent';
import { DocsContent } from './DocsContent';
import { HowItWorksContent } from './HowItWorksContent';
import { PricingContent } from './PricingContent';
import { ContactContent } from './ContactContent';
import { WhyCorridorContent } from './WhyPaydayContent';
import { WorkHereContent } from './WorkHereContent';
import { ResourcesContent } from './ResourcesContent';
import { ProductOSSuite } from './ProductOSSuite';
import { UseCasesWindow } from './UseCasesWindow';
import { MessageSquare, Phone, Mail, Calendar, FileText, BookOpen, Layers, DollarSign, Users, Video, MessageCircle, UserPlus, Folder, Settings, BarChart3, Zap, Shield, Briefcase } from 'lucide-react';


const iconMap = {
    FileText,
    BookOpen,
    Layers,
    DollarSign,
    Users,
    Video,
    MessageCircle,
    UserPlus,
    Folder,
    Settings,
    BarChart3,
    Zap,
    Shield,
    Briefcase,
    Mail,
    Calendar,
    MessageSquare,
    Phone
};

interface ContentRendererProps {
    handle: string;
    emoji?: string;
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ handle, emoji }) => {
    const content = useLandingContent(handle as any);

    // Special handles that don't need content from useLandingContent
    const specialHandles = ['use_cases', 'product_os'];

    if (!content && !specialHandles.includes(handle)) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-600">Content not found</p>
            </div>
        );
    }
    // Function to get icon component from string
    const getIconComponent = (iconName: string) => {
        const IconComponent = iconMap[iconName as keyof typeof iconMap];
        return IconComponent || FileText; // Fallback icon
    };


    switch (handle) {
        case 'home':
            return <EnhancedHomeContent />;
        case 'docs':
            return <DocsContent data={content} />;
        case 'how_it_works':
            return <HowItWorksContent data={content} />;
        case 'pricing':
            return <PricingContent data={content} />;
        case 'contact':
            return <ContactContent data={content} />;
        case 'why_corridor':
            return <WhyCorridorContent data={content} />;
        case 'work_here':
            return <WorkHereContent data={content} />;
        case 'resources':
            return <ResourcesContent data={content} />;
        case 'product_os':
            return <ProductOSSuite />;
        case 'use_cases':
            return <UseCasesWindow />;
        default:
            return (
                <div className="p-8 text-center">
                    <p className="text-gray-600">Unknown content type</p>
                </div>
            );
    }
};
