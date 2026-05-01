# Workflow Automation Integration

This guide shows how to integrate Corridor with popular workflow automation platforms like n8n, Zapier, and Make (formerly Integromat) for no-code payment automation.

## n8n Integration

### Custom Corridor Node

```typescript
// nodes/Corridor/Corridor.node.ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

import { CorridorClient } from '@corridor/sdk';

export class Corridor implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Corridor',
    name: 'corridor',
    icon: 'file:corridor.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with Corridor payment infrastructure',
    defaults: {
      name: 'Corridor',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'corridorApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Payment',
            value: 'payment',
          },
          {
            name: 'Goal',
            value: 'goal',
          },
          {
            name: 'Wallet',
            value: 'wallet',
          },
        ],
        default: 'payment',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['payment'],
          },
        },
        options: [
          {
            name: 'Create Split Payment',
            value: 'createSplit',
            description: 'Create a split payment across multiple recipients',
            action: 'Create a split payment',
          },
          {
            name: 'Get Payment',
            value: 'get',
            description: 'Get payment details',
            action: 'Get a payment',
          },
        ],
        default: 'createSplit',
      },
      // Split Payment Fields
      {
        displayName: 'Amount',
        name: 'amount',
        type: 'number',
        displayOptions: {
          show: {
            resource: ['payment'],
            operation: ['createSplit'],
          },
        },
        default: 0,
        placeholder: '100.00',
        description: 'Payment amount',
      },
      {
        displayName: 'Currency',
        name: 'currency',
        type: 'options',
        displayOptions: {
          show: {
            resource: ['payment'],
            operation: ['createSplit'],
          },
        },
        options: [
          { name: 'USDC', value: 'USDC' },
          { name: 'USD', value: 'USD' },
          { name: 'KES', value: 'KES' },
          { name: 'NGN', value: 'NGN' },
        ],
        default: 'USDC',
      },
      {
        displayName: 'Recipients',
        name: 'recipients',
        placeholder: 'Add Recipient',
        type: 'fixedCollection',
        displayOptions: {
          show: {
            resource: ['payment'],
            operation: ['createSplit'],
          },
        },
        default: {},
        typeOptions: {
          multipleValues: true,
        },
        options: [
          {
            name: 'recipient',
            displayName: 'Recipient',
            values: [
              {
                displayName: 'Wallet ID',
                name: 'walletId',
                type: 'string',
                default: '',
                placeholder: 'wallet-123',
              },
              {
                displayName: 'Percentage',
                name: 'percentage',
                type: 'number',
                default: 0,
                placeholder: '50',
                description: 'Percentage of total amount (0-100)',
              },
            ],
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    // Get credentials
    const credentials = await this.getCredentials('corridorApi');
    const client = new CorridorClient({
      apiKey: credentials.apiKey as string,
      environment: credentials.environment as 'sandbox' | 'production',
    });

    for (let i = 0; i < items.length; i++) {
      try {
        if (resource === 'payment') {
          if (operation === 'createSplit') {
            const amount = this.getNodeParameter('amount', i) as number;
            const currency = this.getNodeParameter('currency', i) as string;
            const recipients = this.getNodeParameter('recipients.recipient', i, []) as Array<{
              walletId: string;
              percentage: number;
            }>;

            const payment = await client.payments.createSplit({
              amount,
              currency,
              recipients,
            });

            returnData.push({
              json: {
                id: payment.id,
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                recipients: payment.recipients,
                createdAt: payment.createdAt,
              },
            });
          } else if (operation === 'get') {
            const paymentId = this.getNodeParameter('paymentId', i) as string;
            const payment = await client.payments.get(paymentId);

            returnData.push({
              json: payment,
            });
          }
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
            },
          });
          continue;
        }
        throw new NodeOperationError(this.getNode(), error);
      }
    }

    return [returnData];
  }
}
```

### n8n Workflow Examples

```json
{
  "name": "Automated Payroll Processing",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 9 1 * *"
            }
          ]
        }
      },
      "name": "Monthly Trigger",
      "type": "n8n-nodes-base.cron",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT employee_id, wallet_id, salary, name FROM employees WHERE status = 'active'"
      },
      "name": "Get Employees",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [460, 300]
    },
    {
      "parameters": {
        "resource": "payment",
        "operation": "createSplit",
        "amount": "={{$json[\"salary\"]}}",
        "currency": "USDC",
        "recipients": {
          "recipient": [
            {
              "walletId": "={{$json[\"wallet_id\"]}}",
              "percentage": 100
            }
          ]
        }
      },
      "name": "Process Salary Payment",
      "type": "corridor",
      "typeVersion": 1,
      "position": [680, 300]
    },
    {
      "parameters": {
        "operation": "insert",
        "table": "payroll_records",
        "columns": "employee_id, payment_id, amount, processed_at",
        "values": "={{$json[\"employee_id\"]}}, {{$json[\"id\"]}}, {{$json[\"amount\"]}}, NOW()"
      },
      "name": "Record Payment",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [900, 300]
    }
  ],
  "connections": {
    "Monthly Trigger": {
      "main": [
        [
          {
            "node": "Get Employees",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Get Employees": {
      "main": [
        [
          {
            "node": "Process Salary Payment",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Process Salary Payment": {
      "main": [
        [
          {
            "node": "Record Payment",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Zapier Integration

### Custom Zapier App

```javascript
// index.js
const authentication = {
  type: 'custom',
  fields: [
    {
      computed: false,
      key: 'apiKey',
      required: true,
      label: 'API Key',
      type: 'string',
      helpText: 'Your Corridor API key'
    },
    {
      computed: false,
      key: 'environment',
      required: true,
      label: 'Environment',
      type: 'string',
      choices: ['sandbox', 'production'],
      default: 'sandbox'
    }
  ],
  test: {
    url: 'https://api.corridormoney.net/api/auth/verify',
    method: 'GET',
    headers: {
      'X-API-Key': '{{bundle.authData.apiKey}}'
    }
  }
};

const createSplitPayment = {
  key: 'createSplitPayment',
  noun: 'Split Payment',
  display: {
    label: 'Create Split Payment',
    description: 'Creates a new split payment across multiple recipients'
  },
  operation: {
    inputFields: [
      {
        key: 'amount',
        label: 'Amount',
        type: 'number',
        required: true,
        helpText: 'Total amount to split'
      },
      {
        key: 'currency',
        label: 'Currency',
        type: 'string',
        choices: ['USDC', 'USD', 'KES', 'NGN'],
        default: 'USDC',
        required: true
      },
      {
        key: 'recipients',
        label: 'Recipients',
        type: 'text',
        required: true,
        helpText: 'JSON array of recipients with walletId and percentage'
      },
      {
        key: 'message',
        label: 'Message',
        type: 'string',
        required: false,
        helpText: 'Optional payment message'
      }
    ],
    perform: async (z, bundle) => {
      const baseUrl = bundle.authData.environment === 'production' 
        ? 'https://api.corridormoney.net'
        : 'https://api-sandbox.corridormoney.net';

      const response = await z.request({
        url: `${baseUrl}/api/payments/split`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': bundle.authData.apiKey
        },
        body: {
          amount: bundle.inputData.amount,
          currency: bundle.inputData.currency,
          recipients: JSON.parse(bundle.inputData.recipients),
          message: bundle.inputData.message
        }
      });

      return response.data;
    },
    sample: {
      id: 'split_123',
      status: 'completed',
      amount: 100.0,
      currency: 'USDC',
      recipients: [
        { walletId: 'wallet-1', percentage: 60, amount: 60.0 },
        { walletId: 'wallet-2', percentage: 40, amount: 40.0 }
      ]
    }
  }
};

const paymentCompletedTrigger = {
  key: 'paymentCompleted',
  noun: 'Payment',
  display: {
    label: 'Payment Completed',
    description: 'Triggers when a payment is completed'
  },
  operation: {
    type: 'hook',
    performSubscribe: async (z, bundle) => {
      const baseUrl = bundle.authData.environment === 'production' 
        ? 'https://api.corridormoney.net'
        : 'https://api-sandbox.corridormoney.net';

      const response = await z.request({
        url: `${baseUrl}/api/webhooks`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': bundle.authData.apiKey
        },
        body: {
          url: bundle.targetUrl,
          events: ['payment.completed']
        }
      });

      return response.data;
    },
    performUnsubscribe: async (z, bundle) => {
      const baseUrl = bundle.authData.environment === 'production' 
        ? 'https://api.corridormoney.net'
        : 'https://api-sandbox.corridormoney.net';

      await z.request({
        url: `${baseUrl}/api/webhooks/${bundle.subscribeData.id}`,
        method: 'DELETE',
        headers: {
          'X-API-Key': bundle.authData.apiKey
        }
      });
    },
    perform: (z, bundle) => {
      return [bundle.cleanedRequest];
    },
    sample: {
      id: 'evt_123',
      type: 'payment.completed',
      data: {
        payment_id: 'pay_123',
        amount: 100.0,
        currency: 'USDC',
        status: 'completed'
      }
    }
  }
};

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  authentication,
  triggers: {
    [paymentCompletedTrigger.key]: paymentCompletedTrigger
  },
  creates: {
    [createSplitPayment.key]: createSplitPayment
  }
};
```

### Zapier Workflow Examples

**Automated Team Bonus Distribution**
1. **Trigger**: New row in Google Sheets (team performance data)
2. **Action**: Create split payment in Corridor
3. **Action**: Send Slack notification to team
4. **Action**: Update payment status in Airtable

**Goal Completion Rewards**
1. **Trigger**: Goal completed webhook from Corridor
2. **Action**: Send congratulations email via Gmail
3. **Action**: Create reward payment
4. **Action**: Post celebration message in Discord

## Make (Integromat) Integration

### Custom Make Module

```javascript
// modules/corridor/index.js
module.exports = {
  label: 'Corridor',
  description: 'Payment infrastructure and financial operations',
  
  connection: {
    label: 'Corridor Connection',
    description: 'Connect to your Corridor account',
    
    parameters: [
      {
        name: 'apiKey',
        type: 'text',
        label: 'API Key',
        required: true
      },
      {
        name: 'environment',
        type: 'select',
        label: 'Environment',
        options: [
          { label: 'Sandbox', value: 'sandbox' },
          { label: 'Production', value: 'production' }
        ],
        default: 'sandbox'
      }
    ],
    
    test: {
      url: 'https://api.corridormoney.net/api/auth/verify',
      method: 'GET',
      headers: {
        'X-API-Key': '{{connection.apiKey}}'
      }
    }
  },
  
  modules: [
    {
      name: 'createSplitPayment',
      label: 'Create Split Payment',
      description: 'Create a payment split across multiple recipients',
      
      parameters: [
        {
          name: 'amount',
          type: 'number',
          label: 'Amount',
          required: true
        },
        {
          name: 'currency',
          type: 'select',
          label: 'Currency',
          options: [
            { label: 'USDC', value: 'USDC' },
            { label: 'USD', value: 'USD' },
            { label: 'KES', value: 'KES' },
            { label: 'NGN', value: 'NGN' }
          ],
          default: 'USDC'
        },
        {
          name: 'recipients',
          type: 'array',
          label: 'Recipients',
          spec: [
            {
              name: 'walletId',
              type: 'text',
              label: 'Wallet ID',
              required: true
            },
            {
              name: 'percentage',
              type: 'number',
              label: 'Percentage',
              required: true
            }
          ]
        },
        {
          name: 'message',
          type: 'text',
          label: 'Message'
        }
      ],
      
      execute: async (bundle) => {
        const baseUrl = bundle.connection.environment === 'production' 
          ? 'https://api.corridormoney.net'
          : 'https://api-sandbox.corridormoney.net';

        const response = await bundle.request({
          url: `${baseUrl}/api/payments/split`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': bundle.connection.apiKey
          },
          body: JSON.stringify({
            amount: bundle.parameters.amount,
            currency: bundle.parameters.currency,
            recipients: bundle.parameters.recipients,
            message: bundle.parameters.message
          })
        });

        return response.json();
      }
    },
    
    {
      name: 'paymentWebhook',
      label: 'Payment Webhook',
      description: 'Triggers when payment events occur',
      type: 'webhook',
      
      webhook: {
        subscribe: async (bundle) => {
          const baseUrl = bundle.connection.environment === 'production' 
            ? 'https://api.corridormoney.net'
            : 'https://api-sandbox.corridormoney.net';

          const response = await bundle.request({
            url: `${baseUrl}/api/webhooks`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': bundle.connection.apiKey
            },
            body: JSON.stringify({
              url: bundle.targetUrl,
              events: ['payment.completed', 'payment.failed']
            })
          });

          return response.json();
        },
        
        unsubscribe: async (bundle) => {
          const baseUrl = bundle.connection.environment === 'production' 
            ? 'https://api.corridormoney.net'
            : 'https://api-sandbox.corridormoney.net';

          await bundle.request({
            url: `${baseUrl}/api/webhooks/${bundle.webhookId}`,
            method: 'DELETE',
            headers: {
              'X-API-Key': bundle.connection.apiKey
            }
          });
        }
      }
    }
  ]
};
```

## Power Automate Integration

### Custom Connector

```json
{
  "swagger": "2.0",
  "info": {
    "title": "Corridor Connector",
    "description": "Connect to Corridor payment infrastructure",
    "version": "1.0"
  },
  "host": "api.corridormoney.net",
  "basePath": "/api",
  "schemes": ["https"],
  "consumes": ["application/json"],
  "produces": ["application/json"],
  "securityDefinitions": {
    "API Key": {
      "type": "apiKey",
      "in": "header",
      "name": "X-API-Key"
    }
  },
  "security": [{"API Key": []}],
  "paths": {
    "/payments/split": {
      "post": {
        "summary": "Create Split Payment",
        "description": "Creates a new split payment",
        "operationId": "CreateSplitPayment",
        "parameters": [
          {
            "name": "body",
            "in": "body",
            "required": true,
            "schema": {
              "type": "object",
              "properties": {
                "amount": {"type": "number"},
                "currency": {"type": "string"},
                "recipients": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "walletId": {"type": "string"},
                      "percentage": {"type": "number"}
                    }
                  }
                },
                "message": {"type": "string"}
              },
              "required": ["amount", "currency", "recipients"]
            }
          }
        ],
        "responses": {
          "201": {
            "description": "Payment created",
            "schema": {
              "type": "object",
              "properties": {
                "id": {"type": "string"},
                "status": {"type": "string"},
                "amount": {"type": "number"},
                "currency": {"type": "string"}
              }
            }
          }
        }
      }
    }
  }
}
```

## Common Workflow Patterns

### 1. Automated Payroll Processing
- **Trigger**: Monthly schedule or CSV upload
- **Process**: Read employee data, calculate payments, create split payments
- **Notify**: Send confirmation emails, update HR systems

### 2. Commission Distribution
- **Trigger**: Sales data update in CRM
- **Process**: Calculate commissions, create payments to sales team
- **Track**: Update commission tracking, generate reports

### 3. Expense Reimbursement
- **Trigger**: Expense report approval
- **Process**: Create payment to employee wallet
- **Record**: Update accounting system, send receipt

### 4. Goal-Based Rewards
- **Trigger**: Goal completion webhook
- **Process**: Calculate reward amounts, distribute to contributors
- **Celebrate**: Send congratulations, post to social channels

### 5. Subscription Revenue Sharing
- **Trigger**: Monthly subscription billing
- **Process**: Calculate revenue shares, distribute to partners
- **Report**: Generate partner statements, update dashboards

## Best Practices

1. **Error Handling**: Always include error handling and retry logic
2. **Validation**: Validate data before sending to Corridor APIs
3. **Logging**: Log all workflow executions for debugging
4. **Testing**: Test workflows in sandbox before production
5. **Monitoring**: Set up alerts for failed workflows
6. **Security**: Secure API keys and use environment variables
7. **Documentation**: Document workflow logic and dependencies

## Support

For workflow automation help:
- Email: automation@corridormoney.net
- Documentation: https://docs.corridormoney.net/automation
- Community: https://community.corridormoney.net