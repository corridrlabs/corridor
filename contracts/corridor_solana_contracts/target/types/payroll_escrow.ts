/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/payroll_escrow.json`.
 */
export type PayrollEscrow = {
  "address": "H6Ya3TvQqMJNqdTEEH6RWsFQckpGnqDzkhYiYC2a4ESe",
  "metadata": {
    "name": "payrollEscrow",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Payroll Escrow Program on Solana"
  },
  "instructions": [
    {
      "name": "depositPayroll",
      "discriminator": [
        230,
        2,
        141,
        15,
        125,
        33,
        80,
        77
      ],
      "accounts": [
        {
          "name": "escrowAccount",
          "writable": true
        },
        {
          "name": "escrowVault",
          "writable": true
        },
        {
          "name": "employer",
          "writable": true,
          "signer": true
        },
        {
          "name": "employerTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeEscrow",
      "discriminator": [
        243,
        160,
        77,
        153,
        11,
        92,
        48,
        209
      ],
      "accounts": [
        {
          "name": "escrowAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "payrollId",
          "type": "string"
        }
      ]
    },
    {
      "name": "releasePayment",
      "discriminator": [
        24,
        34,
        191,
        86,
        145,
        160,
        183,
        233
      ],
      "accounts": [
        {
          "name": "escrowAccount",
          "writable": true
        },
        {
          "name": "escrowSigner",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  115,
                  105,
                  103,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "escrowAccount"
              }
            ]
          }
        },
        {
          "name": "escrowVault",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "employeeTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "escrowAccount",
      "discriminator": [
        36,
        69,
        48,
        18,
        128,
        225,
        125,
        135
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Unauthorized access"
    },
    {
      "code": 6001,
      "name": "insufficientFunds",
      "msg": "Insufficient funds in escrow"
    }
  ],
  "types": [
    {
      "name": "escrowAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "payrollId",
            "type": "string"
          },
          {
            "name": "totalAmount",
            "type": "u64"
          },
          {
            "name": "isReleased",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
