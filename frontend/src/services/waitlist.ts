import api from './api';

export interface WaitlistPayload {
  name: string;
  email: string;
  company: string;
  segment: string;
  use_case: string;
  volume?: string;
  preferred_channel?: 'webapp' | 'api' | 'whatsapp';
  notes?: string;
}

export interface WaitlistResponse extends WaitlistPayload {
  id: string;
  created_at: string;
}

export const waitlistService = {
  async join(payload: WaitlistPayload): Promise<WaitlistResponse> {
    const { data } = await api.post<WaitlistResponse>('/api/waitlist/', {
      ...payload,
      preferred_channel: payload.preferred_channel || 'webapp',
      volume: payload.volume || 'unknown',
      notes: payload.notes || '',
    });
    return data;
  },
};

