import { withApiPath } from '../config/env';

// frontend/src/services/waitlistService.ts
export const waitlistService = {
  join: async (data: { 
    name: string; 
    email: string; 
    company: string; 
    segment: string; 
    use_case: string; 
    preferred_channel: string; 
    volume: string; 
    notes: string; 
  }) => {
    const response = await fetch(withApiPath('/waitlist/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to join waitlist');
    }
    return response.json();
  },
};
