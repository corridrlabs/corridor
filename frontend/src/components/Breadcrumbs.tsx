import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  path?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items = [], showHome = true }) => {
  const location = useLocation();
  
  // Generate breadcrumbs from current path if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [];
    
    // Always include home
    crumbs.push({ name: 'Home', path: '/' });
    
    // Build breadcrumb trail
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const name = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      crumbs.push({ name, path: currentPath });
    });
    
    return crumbs;
  };

  const breadcrumbs = items.length > 0 ? items : generateBreadcrumbs();
  
  // Add structured data for breadcrumbs
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path ? `https://corridor.africa${item.path}` : undefined
    }))
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      <nav className="flex items-center space-x-2 text-sm text-gray-400 py-4 px-6" aria-label="Breadcrumb">
        {showHome && (
          <Link
            to="/"
            className="flex items-center hover:text-white transition-colors"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
          </Link>
        )}
        
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const showHomeIcon = showHome && index === 0;
          
          return (
            <React.Fragment key={index}>
              {!showHomeIcon && (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
              
              {item.path && !isLast ? (
                <Link
                  to={item.path}
                  className="hover:text-white transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="text-white font-medium">
                  {item.name}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </>
  );
};

export default Breadcrumbs;