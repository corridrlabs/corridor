import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { DOCS_URL } from '../config/env';

const DocsIframe: React.FC = () => {
  const [searchParams] = useSearchParams();

  const getDocsPath = () => {
    const params = new URLSearchParams(searchParams);
    const queryString = params.toString();
    const baseUrl = DOCS_URL;

    // In development, use the Next.js dev server
    // DOCS_URL should be set to http://localhost:3001 in .env for development
    return `${baseUrl}${queryString ? `?${queryString}` : ''}`;
  };

  return (
    <div className="min-h-screen">
      <iframe
        src={getDocsPath()}
        className="w-full h-screen border-0"
        title="Documentation"
        onError={() => {
          console.error('Failed to load docs iframe. Make sure Next.js dev server is running on port 3001.');
        }}
      />
    </div>
  );
};

export default DocsIframe;
