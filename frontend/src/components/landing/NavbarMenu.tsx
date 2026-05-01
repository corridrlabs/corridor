import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarMenuProps {
  onOpenWindow: (handle: string, title: string) => void;
}

interface MenuItem {
  label: string;
  handle?: string;
  title?: string;
  type?: 'window' | 'route';
  path?: string;
}

export const NavbarMenu: React.FC<NavbarMenuProps> = ({ onOpenWindow }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const navigate = useNavigate();

  const menus: { label: string; items: MenuItem[] }[] = [
    {
      label: 'Product OS',
      items: [
        { label: 'Overview', type: 'window', handle: 'product_os', title: 'Product OS Features' },
        { label: 'Analytics', type: 'window', handle: 'product_os', title: 'Product OS Features' },
        { label: 'Payments', type: 'window', handle: 'pricing', title: 'Pricing' },
        { label: 'Automation', type: 'window', handle: 'how_it_works', title: 'How it works' },
        { label: 'EWA', type: 'window', handle: 'how_it_works', title: 'How it works' }
      ]
    },
    {
      label: 'Pricing',
      items: [
        { label: 'Plans', type: 'window', handle: 'pricing', title: 'Pricing' },
        { label: 'Calculator', type: 'window', handle: 'pricing', title: 'Pricing' },
        { label: 'Enterprise', type: 'window', handle: 'contact', title: 'Talk to a human' }
      ]
    },
    {
      label: 'Docs',
      items: [
        { label: 'Getting Started', type: 'window', handle: 'docs', title: 'Docs' },
        { label: 'API Reference', type: 'route', path: '/docs/api-reference/authentication' },
        { label: 'Guides', type: 'window', handle: 'docs', title: 'Docs' },
        { label: 'Support', type: 'window', handle: 'contact', title: 'Talk to a human' }
      ]
    },
    {
      label: 'Community',
      items: [
        { label: 'Blog', type: 'window', handle: 'resources', title: 'Resources' },
        { label: 'Case Studies', type: 'window', handle: 'resources', title: 'Resources' },
        { label: 'Events', type: 'window', handle: 'resources', title: 'Resources' },
        { label: 'Forum', type: 'window', handle: 'resources', title: 'Resources' }
      ]
    },
    {
      label: 'Company',
      items: [
        { label: 'About', type: 'route', path: '/docs/business/getting-started/welcome' },
        { label: 'Careers', type: 'route', path: '/careers' },
        { label: 'Contact', type: 'window', handle: 'contact', title: 'Talk to a human' },
        { label: 'Press', type: 'window', handle: 'contact', title: 'Talk to a human' }
      ]
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedOutside = Object.values(menuRefs.current).every(
        ref => ref && !ref.contains(event.target as Node)
      );
      if (clickedOutside) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-1">
      {menus.map((menu, index) => (
        <div
          key={index}
          className="relative"
          ref={el => (menuRefs.current[menu.label] = el)}
        >
          <button
            onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
            onMouseEnter={() => setActiveMenu(menu.label)}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded flex items-center gap-1"
          >
            {menu.label}
            <ChevronDown className="w-3 h-3" />
          </button>

          {activeMenu === menu.label && (
            <div
              className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl min-w-[200px] z-50"
              onMouseLeave={() => setActiveMenu(null)}
            >
              {menu.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={() => {
                    if (item.type === 'route' && item.path) {
                      navigate(item.path);
                    } else if (item.handle && item.title) {
                      onOpenWindow(item.handle, item.title);
                    }
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
