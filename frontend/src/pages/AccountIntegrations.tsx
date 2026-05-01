import React from 'react';
import { useUser } from '../contexts/UserContext';
import ConnectorMarketplace from '../components/ConnectorMarketplace';

export const AccountIntegrations = () => {
    const { user } = useUser();

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900">No Account Selected</h3>
                    <p className="text-gray-500 mt-2">Please log in to view integrations.</p>
                </div>
            </div>
        );
    }

    return <ConnectorMarketplace organizationId="default" />;
};
