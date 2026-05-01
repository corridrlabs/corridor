import { useState } from 'react';

interface UpgradePromptState {
  isOpen: boolean;
  feature: string;
  message: string;
}

export const useUpgradePrompt = () => {
  const [state, setState] = useState<UpgradePromptState>({
    isOpen: false,
    feature: '',
    message: '',
  });

  const handleApiError = (error: any): boolean => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 402) {
      const featureMatch = data?.detail?.match(/\[(\w+)\]/);
      const feature = featureMatch?.[1] || data?.feature || 'this feature';
      setState({
        isOpen: true,
        feature: feature,
        message: data?.detail || `Access to ${feature} requires a Pro subscription`,
      });
      return true;
    }
    return false;
  };

  const openUpgradePrompt = (feature?: string, message?: string) => {
    setState({
      isOpen: true,
      feature: feature || '',
      message: message || '',
    });
  };

  const closeUpgradePrompt = () => {
    setState({ isOpen: false, feature: '', message: '' });
  };

  return {
    upgradePrompt: state,
    handleApiError,
    openUpgradePrompt,
    closeUpgradePrompt,
  };
};