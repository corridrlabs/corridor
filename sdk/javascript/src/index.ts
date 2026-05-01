/**
 * Corridor Connector SDK for JavaScript/TypeScript
 * Build custom connectors for the Corridor platform
 */

import axios, { AxiosInstance } from 'axios';

export enum ConnectorType {
    PAYMENT = 'payment',
    ERP = 'erp',
    CRM = 'crm',
    COMMUNICATION = 'communication',
    STORAGE = 'storage',
    ANALYTICS = 'analytics',
    CUSTOM = 'custom',
}

export enum AuthType {
    API_KEY = 'api_key',
    OAUTH2 = 'oauth2',
    BASIC = 'basic',
    BEARER = 'bearer',
    CUSTOM = 'custom',
}

export interface ConnectorConfig {
    [key: string]: any;
    rate_limit?: number;
    timeout?: number;
}

export interface ActionDefinition {
    name: string;
    description: string;
    parameters: string[];
}

export interface ConnectorMetadata {
    name: string;
    type: string;
    auth_type: string;
    rate_limit: number;
    actions: ActionDefinition[];
}

/**
 * Base connector class
 * 
 * @example
 *   }
 * 
 *   async execute(action: string, params: any): Promise<any> {
 *     if (action === 'send_message') {
 *       return await this.sendMessage(params);
 *     }
 *     throw new Error(`Unknown action: ${action}`);
 *   }
 * 
 *   getAvailableActions(): ActionDefinition[] {
 *     return [
 *       {
 *         name: 'send_message',
 *         description: 'Send a message',
 *         parameters: ['to', 'message']
 *       }
 *     ];
 *   }
 * }
 * ```
 */
export abstract class BaseConnector {
    protected config: ConnectorConfig;
    protected name: string;
    protected connectorType: ConnectorType;
    protected authType: AuthType;
    protected rateLimit: number;
    protected timeout: number;
    protected client?: AxiosInstance;

    constructor(config: ConnectorConfig) {
        this.config = config;
        this.name = this.constructor.name;
        this.connectorType = ConnectorType.CUSTOM;
        this.authType = AuthType.API_KEY;
        this.rateLimit = config.rate_limit || 100;
        this.timeout = config.timeout || 30000;
    }

    /**
     * Authenticate with the external service
     */
    abstract authenticate(): Promise<boolean>;

    /**
     * Execute an action
     */
    abstract execute(action: string, params: any): Promise<any>;

    /**
     * Get list of available actions
     */
    abstract getAvailableActions(): ActionDefinition[];

    /**
     * Get required configuration fields
     */
    getRequiredConfigFields(): string[] {
        return [];
    }

    /**
     * Validate connector configuration
     */
    async validateConfig(): Promise<boolean> {
        const required = this.getRequiredConfigFields();
        for (const field of required) {
            if (!(field in this.config)) {
                console.error(`Missing required config: ${field}`);
                return false;
            }
        }
        return true;
    }

    /**
     * Test connection to external service
     */
    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            const authenticated = await this.authenticate();
            return {
                success: authenticated,
                message: authenticated ? 'Connection successful' : 'Authentication failed',
            };
        } catch (error) {
            return {
                success: false,
                message: `Connection failed: ${error}`,
            };
        }
    }

    /**
     * Get connector metadata
     */
    getMetadata(): ConnectorMetadata {
        return {
            name: this.name,
            type: this.connectorType,
            auth_type: this.authType,
            rate_limit: this.rateLimit,
            actions: this.getAvailableActions(),
        };
    }
}

/**
 * Base class for HTTP-based connectors
 */
export abstract class HTTPConnector extends BaseConnector {
    protected baseUrl: string;
    protected headers: Record<string, string>;

    constructor(config: ConnectorConfig & { base_url: string; headers?: Record<string, string> }) {
        super(config);
        this.baseUrl = config.base_url;
        this.headers = config.headers || {};
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: this.headers,
            timeout: this.timeout,
        });
    }

    protected async get(path: string, params?: any): Promise<any> {
        const response = await this.client!.get(path, { params });
        return response.data;
    }

    protected async post(path: string, data?: any): Promise<any> {
        const response = await this.client!.post(path, data);
        return response.data;
    }

    protected async put(path: string, data?: any): Promise<any> {
        const response = await this.client!.put(path, data);
        return response.data;
    }

    protected async delete(path: string): Promise<any> {
        const response = await this.client!.delete(path);
        return response.data;
    }
}

/**
 * Connector registry
 */
export class ConnectorRegistry {
    private static connectors: Map<string, typeof BaseConnector> = new Map();

    static register(connectorClass: typeof BaseConnector): void {
        this.connectors.set(connectorClass.name, connectorClass);
    }

    static get(name: string, config: ConnectorConfig): BaseConnector | null {
        const ConnectorClass = this.connectors.get(name);
        if (ConnectorClass) {
            // TypeScript doesn't know ConnectorClass is a concrete implementation
            // The registry only stores concrete classes, never the abstract BaseConnector
            return new (ConnectorClass as any)(config);
        }
        return null;
    }

    static listAll(): string[] {
        return Array.from(this.connectors.keys());
    }
}

/**
 * Decorator to register a connector
 */
export function connector(target: typeof BaseConnector): void {
    ConnectorRegistry.register(target);
}

export default {
    BaseConnector,
    HTTPConnector,
    ConnectorRegistry,
    ConnectorType,
    AuthType,
    connector,
};
