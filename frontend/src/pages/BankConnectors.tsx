import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import api from '../services/api';
import {
    Search, Building2, Globe, Check, CreditCard, Smartphone,
    Shield, Zap, ArrowRight, Clock, Percent
} from 'lucide-react';

interface BankConnector {
    id: string;
    name: string;
    description: string;
    supported_countries: string[];
    supported_currencies: string[];
    features: Record<string, boolean>;
    fee_structure: Record<string, any>;
    settlement_time?: string;
}

const countryFlags: Record<string, string> = {
    'NG': '🇳🇬', 'KE': '🇰🇪', 'GH': '🇬🇭', 'ZA': '🇿🇦', 'TZ': '🇹🇿',
    'UG': '🇺🇬', 'RW': '🇷🇼', 'CI': '🇨🇮', 'SN': '🇸🇳', 'CM': '🇨🇲',
    'EG': '🇪🇬', 'MA': '🇲🇦', 'ET': '🇪🇹', 'ZM': '🇿🇲', 'MW': '🇲🇼',
    'ZW': '🇿🇼', 'BW': '🇧🇼', 'MZ': '🇲🇿', 'NA': '🇳🇦', 'MU': '🇲🇺',
    'SS': '🇸🇸', 'CD': '🇨🇩', 'SC': '🇸🇨', 'BU': '🇧🇮', 'ML': '🇲🇱',
    'NE': '🇳🇪', 'BF': '🇧🇫', 'TG': '🇹🇬', 'BJ': '🇧🇯', 'GW': '🇬🇼',
    'CV': '🇨🇻', 'GM': '🇬🇲', 'SL': '🇸🇱', 'LR': '🇱🇷', 'GN': '🇬🇳',
    'TD': '🇹🇩', 'CF': '🇨🇫', 'GA': '🇬🇦', 'CG': '🇨🇬', 'AO': '🇦🇴',
    'SZ': '🇸🇿'
};

export default function BankConnectors() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedConnector, setSelectedConnector] = useState<BankConnector | null>(null);
    const [activeTab, setActiveTab] = useState('all');

    // Fetch all connectors
    const { data: connectorsData, isLoading } = useQuery({
        queryKey: ['bank-connectors'],
        queryFn: () => api.get('/bank-connectors').then(res => res.data)
    });

    const connectors: BankConnector[] = connectorsData?.connectors || [];

    const filteredConnectors = connectors.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getConnectorLogo = (id: string) => {
        const logos: Record<string, string> = {
            'flutterwave': '🦋',
            'monnify': '💳',
            'cellulant': '📱',
            'providus': '🏦',
            'equity': '🏛️',
            'kcb': '🏧',
            'absa': '🔴',
            'ecobank': '🌍'
        };
        return logos[id] || '🏦';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-emerald-600" />
                        Bank Payment Connectors
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Connect to 40+ African countries for payroll disbursements
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-emerald-600">{connectors.length}</div>
                    <div className="text-sm text-gray-500">Payment Rails</div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
                    <div className="text-2xl font-bold">40+</div>
                    <div className="text-sm opacity-90 flex items-center gap-1">
                        <Globe className="w-4 h-4" /> Countries
                    </div>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
                    <div className="text-2xl font-bold">15+</div>
                    <div className="text-sm opacity-90 flex items-center gap-1">
                        <CreditCard className="w-4 h-4" /> Currencies
                    </div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-4 text-white">
                    <div className="text-2xl font-bold">10K</div>
                    <div className="text-sm opacity-90 flex items-center gap-1">
                        <Zap className="w-4 h-4" /> Max Batch
                    </div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-4 text-white">
                    <div className="text-2xl font-bold">Instant</div>
                    <div className="text-sm opacity-90 flex items-center gap-1">
                        <Clock className="w-4 h-4" /> Settlement
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                        placeholder="Search connectors..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Connectors Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredConnectors.map((connector) => (
                        <Card key={connector.id} className="hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-emerald-200 dark:hover:border-emerald-800">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl">
                                            {getConnectorLogo(connector.id)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{connector.name}</CardTitle>
                                            <div className="flex items-center gap-1 mt-1">
                                                {connector.supported_countries.slice(0, 5).map(code => (
                                                    <span key={code} className="text-sm" title={code}>
                                                        {countryFlags[code] || code}
                                                    </span>
                                                ))}
                                                {connector.supported_countries.length > 5 && (
                                                    <span className="text-xs text-gray-500">
                                                        +{connector.supported_countries.length - 5}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {connector.settlement_time === 'instant' && (
                                        <Badge className="bg-green-100 text-green-700 text-xs">
                                            <Zap className="w-3 h-3 mr-1" /> Instant
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                                    {connector.description}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {connector.features?.bulk_disbursement && (
                                        <Badge variant="secondary" className="text-xs">Bulk Payroll</Badge>
                                    )}
                                    {connector.features?.mobile_money && (
                                        <Badge variant="secondary" className="text-xs">
                                            <Smartphone className="w-3 h-3 mr-1" /> Mobile Money
                                        </Badge>
                                    )}
                                    {connector.features?.account_validation && (
                                        <Badge variant="secondary" className="text-xs">
                                            <Shield className="w-3 h-3 mr-1" /> Validation
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    {connector.supported_currencies.slice(0, 3).join(', ')}
                                    {connector.supported_currencies.length > 3 && ` +${connector.supported_currencies.length - 3}`}
                                </div>
                                <Button onClick={() => setSelectedConnector(connector)}>
                                    Configure <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Connector Detail Dialog */}
            <Dialog open={!!selectedConnector} onOpenChange={() => setSelectedConnector(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl">
                                {selectedConnector && getConnectorLogo(selectedConnector.id)}
                            </div>
                            {selectedConnector?.name}
                        </DialogTitle>
                        <DialogDescription>{selectedConnector?.description}</DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Supported Countries</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedConnector?.supported_countries.map(code => (
                                    <span key={code} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                                        {countryFlags[code] || ''} {code}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">Supported Currencies</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedConnector?.supported_currencies.map(curr => (
                                    <Badge key={curr} variant="secondary">{curr}</Badge>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">Features</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {selectedConnector?.features && Object.entries(selectedConnector.features)
                                    .filter(([_, enabled]) => enabled)
                                    .map(([feature]) => (
                                        <div key={feature} className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-green-500" />
                                            {feature.replace(/_/g, ' ')}
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Percent className="w-4 h-4" /> Fee Structure
                            </h4>
                            <div className="text-sm text-gray-500">
                                Fees vary by currency and transaction amount. Contact support for detailed pricing.
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedConnector(null)}>Cancel</Button>
                        <Button>
                            Connect {selectedConnector?.name}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
