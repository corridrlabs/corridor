/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/ewa_program.json`.
 */
export type EwaProgram = {
  "address": "EQTCgcNGg8NJk695rgjiBvhjYUoPvm2qxwKPVfo1XaM",
  "metadata": {
    "name": "ewaProgram",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Early Wage Access Program on Solana"
  },
  "instructions": [
    {
      "name": "depositLiquidity",
      "discriminator": [
        245,
        99,
        59,
        25,
        151,
        71,
        233,
        249
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "poolVault",
          "writable": true
        },
        {
          "name": "depositor",
          "writable": true,
          "signer": true
        },
        {
          "name": "depositorTokenAccount",
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
      "name": "initializePool",
      "discriminator": [
        95,
        180,
        10,
        172,
        84,
        174,
        232,
        40
      ],
      "accounts": [
        {
          "name": "pool",
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
      "args": []
    },
    {
      "name": "repayAdvance",
      "discriminator": [
        247,
        119,
        157,
        136,
        70,
        66,
        200,
        20
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "poolVault",
          "writable": true
        },
        {
          "name": "advanceAccount",
          "writable": true
        },
        {
          "name": "employee",
          "writable": true,
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
    },
    {
      "name": "requestAdvance",
      "discriminator": [
        30,
        94,
        222,
        131,
        223,
        83,
        0,
        28
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "poolSigner",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
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
                "path": "pool"
              }
            ]
          }
        },
        {
          "name": "poolVault",
          "writable": true
        },
        {
          "name": "advanceAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "employee",
          "writable": true,
          "signer": true
        },
        {
          "name": "employeeTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
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
      "name": "advance",
      "discriminator": [
        66,
        25,
        217,
        133,
        38,
        192,
        224,
        218
      ]
    },
    {
      "name": "liquidityPool",
      "discriminator": [
        66,
        38,
        17,
        64,
        188,
        80,
        68,
        129
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "insufficientLiquidity",
      "msg": "Insufficient liquidity in the pool"
    },
    {
      "code": 6001,
      "name": "alreadyRepaid",
      "msg": "Advance already repaid"
    },
    {
      "code": 6002,
      "name": "insufficientRepayment",
      "msg": "Insufficient repayment amount"
    }
  ],
  "types": [
    {
      "name": "advance",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "employee",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "dueDate",
            "type": "i64"
          },
          {
            "name": "isRepaid",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "liquidityPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "totalLiquidity",
            "type": "u64"
          },
          {
            "name": "totalBorrowed",
            "type": "u64"
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
