// Paystack Integration Script
// Add this to your public/index.html before </body>:
// <script src="https://js.paystack.co/v1/inline.js"></script>

declare global {
    interface Window {
        PaystackPop: any;
    }
}

interface PaystackConfig {
    key: string;
    email: string;
    amount: number; // in kobo (NGN) or pesewas (GHS)
    currency?: string;
    ref?: string;
    onClose?: () => void;
    callback?: (response: any) => void;
}

export const initializePaystack = (config: PaystackConfig) => {
    if (typeof window === 'undefined' || !window.PaystackPop) {
        console.error('Paystack script not loaded');
        return null;
    }

    const handler = window.PaystackPop.setup(config);
    return handler;
};

export const addCardWithPaystack = async (
    publicKey: string,
    userEmail: string,
    onSuccess: (reference: string) => void,
    onError: (error: string) => void
) => {
    const handler = initializePaystack({
        key: publicKey,
        email: userEmail,
        amount: 50 * 100, // 50 NGN authorization charge (in kobo)
        currency: 'NGN',
        ref: `card_${Date.now()}`,
        onClose: () => {
            onError('Payment cancelled');
        },
        callback: (response: any) => {
            if (response.status === 'success') {
                onSuccess(response.reference);
            } else {
                onError('Card authorization failed');
            }
        }
    });

    if (handler) {
        handler.openIframe();
    }
};
