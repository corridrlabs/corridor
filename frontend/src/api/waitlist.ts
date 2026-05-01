import { apiClient } from './client';

export interface WaitlistPayload {
  name: string;
  email: string;
  company: string;
  role: string;
  target_customer: string;
  use_case: string;
  channel?: string;
}

export interface WaitlistEntry extends WaitlistPayload {
  created_at: string;
}

export const waitlistApi = {
  async join(payload: WaitlistPayload): Promise<WaitlistEntry> {
    const { data } = await apiClient.post<WaitlistEntry>('/api/waitlist', payload);
    return data;
  },
};

