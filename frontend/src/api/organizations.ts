// Legacy organizations API - deprecated
// Components using this should migrate to account-level settings

import { accountApi } from './account';

/**
 * @deprecated Use accountApi instead
 */
export const organizationApi = {
    getInfo: accountApi.getInfo,
    get: accountApi.getInfo,
    list: async () => {
        try {
            const user = await accountApi.getInfo();
            if (!user) return [];
            return [{
                id: user.id, // Map account ID to organization ID
                name: user.full_name || 'My Organization',
                slug: 'default'
            }];
        } catch (e) {
            return [];
        }
    },
    create: async (_payload: any) => {
        throw new Error('Organization creation is not supported in this workspace. Use account settings instead.');
    },
    update: async (payload: any) => ({ ...payload }),
    delete: async () => { throw new Error('Organizations not supported'); },
    getProjects: async (_orgId: string) => accountApi.getProjects(),
    createProject: async (_orgId: string, payload: any) => accountApi.createProject(payload),
    getMembers: async (_orgId: string) => accountApi.getMembers(),
    inviteMember: async (_orgId: string, payload: any) => accountApi.inviteMember(payload),
    getUsage: async () => accountApi.getUsage(),
    getActivity: async (limit: number = 10) => accountApi.getActivity(limit),
    getApiKeys: async (_orgId: string) => accountApi.getApiKeys(),
    createApiKey: async (_orgId: string, payload: any) => accountApi.createApiKey(payload),
    revokeApiKey: async (_orgId: string, keyId: string) => accountApi.revokeApiKey(keyId),
    getWebhooks: async (_orgId: string) => accountApi.getWebhooks(),
    createWebhook: async (_orgId: string, payload: any) => accountApi.createWebhook(payload),
    deleteWebhook: async (_orgId: string, webhookId: string) => accountApi.deleteWebhook(webhookId),
};

export interface Organization {
    id: string;
    name: string;
    slug: string;
}
