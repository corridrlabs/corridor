import { apiClient } from './client';

// --- Types ---

export interface CirclePublicKey {
  keyId: string;
  publicKey: string; // PEM-encoded PGP public key
}

export interface InitializeCardDepositRequest {
  amount: string;
  currency: string;
  userId: string;
  keyId: string;         // From Circle's /v1/encryption/public
  encryptedData: string; // PGP-encrypted card data
  expMonth: number;
  expYear: number;
  billingDetails: {
    name: string;
    city: string;
    country: string;       // 2-letter ISO country code
    line1: string;
    postalCode: string;
    district?: string;
  };
}

// From the backend: circle/client.go
export interface CirclePayment {
  id: string;
  amount: {
    amount: string;
    currency: string;
  };
  status: string;
  description: string;
  source: {
    id: string;
    type: string;
  };
  createDate: string;
  updateDate: string;
}

export interface CreatePaymentResponse {
  data: CirclePayment;
}

export interface CryptoDepositAddressResponse {
  address: string;
  blockchain: string;
  memo?: string;
}

// --- API Functions ---

/**
 * Fetches Circle's PGP public key for encrypting card data on the client.
 */
export const getCirclePublicKey = async (): Promise<CirclePublicKey> => {
  const response = await apiClient.get<{ data: CirclePublicKey }>('/api/v1/deposits/card/key');
  return response.data.data;
};

/**
 * Calls the backend with the encrypted card payload to register and charge.
 * Raw card data is PGP-encrypted client-side and never seen by Corridor servers.
 */
export const initializeCardDeposit = async (data: InitializeCardDepositRequest): Promise<CreatePaymentResponse> => {
  const response = await apiClient.post<CreatePaymentResponse>('/api/v1/deposits/card/initialize', data);
  return response.data;
};

/**
 * Fetches the user's unique cryptocurrency deposit address.
 */
export const getCryptoDepositAddress = async (userId: string): Promise<CryptoDepositAddressResponse> => {
  const response = await apiClient.get<CryptoDepositAddressResponse>('/api/v1/deposits/crypto/address', {
    params: { userId },
  });
  return response.data;
};
