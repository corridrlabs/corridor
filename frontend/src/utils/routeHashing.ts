/**
 * Route hashing utility for securing protected routes
 * Generates hashed route IDs to prevent route enumeration
 */

import CryptoJS from 'crypto-js';

const ROUTE_SECRET = import.meta.env.VITE_ROUTE_SECRET || 'corridor-secure-routes-2024';

/**
 * Generate a hashed route ID
 */
export const hashRoute = (route: string): string => {
  return CryptoJS.SHA256(route + ROUTE_SECRET).toString(CryptoJS.enc.Hex).substring(0, 16);
};

/**
 * Verify if a hashed route matches the original
 */
export const verifyRoute = (route: string, hash: string): boolean => {
  return hashRoute(route) === hash;
};

/**
 * Generate secure route with hash
 */
export const generateSecureRoute = (basePath: string, id: string): string => {
  const hash = hashRoute(id);
  return `${basePath}/${hash}`;
};

/**
 * Protected route patterns with hashing
 */
export const PROTECTED_ROUTES = {
  // Organization routes
  ORG_DASHBOARD: (orgId: string) => `/org/${hashRoute(orgId)}/dashboard`,
  ORG_SETTINGS: (orgId: string) => `/org/${hashRoute(orgId)}/settings`,
  ORG_TEAM: (orgId: string) => `/org/${hashRoute(orgId)}/team`,
  ORG_BILLING: (orgId: string) => `/org/${hashRoute(orgId)}/billing`,
  
  // Project routes
  PROJECT_DASHBOARD: (orgId: string, projectId: string) => 
    `/org/${hashRoute(orgId)}/project/${hashRoute(projectId)}/dashboard`,
  PROJECT_SETTINGS: (orgId: string, projectId: string) => 
    `/org/${hashRoute(orgId)}/project/${hashRoute(projectId)}/settings`,
  
  // Platform capabilities
  FINANCIAL_OS: (orgId: string) => `/org/${hashRoute(orgId)}/financial-os`,
  HYBRID_RAILS: (orgId: string) => `/org/${hashRoute(orgId)}/hybrid-rails`,
  USSD: (orgId: string) => `/org/${hashRoute(orgId)}/ussd`,
  CONNECTORS: (orgId: string) => `/org/${hashRoute(orgId)}/connectors`,
  WHATSAPP: (orgId: string) => `/org/${hashRoute(orgId)}/whatsapp`,
  WORKFLOWS: (orgId: string) => `/org/${hashRoute(orgId)}/workflows`,
  
  // Legacy routes (for backward compatibility)
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  WORKFLOWS_LEGACY: '/workflows',
  CUSTOMERS: '/customers',
};

/**
 * Decode hashed route to get original ID
 * Note: This requires storing a mapping in backend or using JWT tokens
 */
export const decodeHashedRoute = (hash: string): string | null => {
  // In production, this should query the backend to resolve the hash
  // For now, we'll use localStorage as a temporary solution
  const mapping = localStorage.getItem('route_mapping');
  if (mapping) {
    const map = JSON.parse(mapping);
    return map[hash] || null;
  }
  return null;
};

/**
 * Store route mapping (temporary solution)
 */
export const storeRouteMapping = (id: string, hash: string) => {
  const mapping = localStorage.getItem('route_mapping');
  const map = mapping ? JSON.parse(mapping) : {};
  map[hash] = id;
  localStorage.setItem('route_mapping', JSON.stringify(map));
};
