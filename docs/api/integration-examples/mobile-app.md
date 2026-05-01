# React Native Mobile App Integration

This guide demonstrates how to integrate Corridor's payment infrastructure into a React Native mobile application for cross-platform payment processing.

## Installation

```bash
npm install @corridor/react-native
# or
yarn add @corridor/react-native

# iOS additional setup
cd ios && pod install
```

## Platform Setup

### Android Configuration

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### iOS Configuration

Add to `ios/YourApp/Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSExceptionDomains</key>
    <dict>
        <key>api.corridormoney.net</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
        </dict>
    </dict>
</dict>
```

## Provider Setup

```tsx
// App.tsx
import React from 'react';
import { CorridorProvider } from '@corridor/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <CorridorProvider
      apiKey="your-api-key"
      environment="sandbox"
    >
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </CorridorProvider>
  );
}
```

## Core Components

### Split Payment Screen

```tsx
// src/screens/SplitPaymentScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { usePayments } from '@corridor/react-native';

interface Recipient {
  walletId: string;
  percentage: number;
  name: string;
}

export function SplitPaymentScreen() {
  const { createSplitPayment, loading } = usePayments();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USDC');
  const [recipients, setRecipients] = useState<Recipient[]>([
    { walletId: '', percentage: 0, name: '' }
  ]);

  const addRecipient = () => {
    setRecipients([...recipients, { walletId: '', percentage: 0, name: '' }]);
  };

  const updateRecipient = (index: number, field: keyof Recipient, value: string | number) => {
    const updated = recipients.map((recipient, i) => 
      i === index ? { ...recipient, [field]: value } : recipient
    );
    setRecipients(updated);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    try {
      const totalPercentage = recipients.reduce((sum, r) => sum + r.percentage, 0);
      
      if (totalPercentage !== 100) {
        Alert.alert('Error', 'Total percentage must equal 100%');
        return;
      }

      const payment = await createSplitPayment({
        amount: parseFloat(amount),
        currency,
        recipients: recipients.map(r => ({
          walletId: r.walletId,
          percentage: r.percentage
        }))
      });

      Alert.alert(
        'Success',
        `Payment created successfully!\nID: ${payment.id}`,
        [{ text: 'OK', onPress: () => resetForm() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create payment. Please try again.');
    }
  };

  const resetForm = () => {
    setAmount('');
    setRecipients([{ walletId: '', percentage: 0, name: '' }]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Split Payment</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Recipients</Text>
        {recipients.map((recipient, index) => (
          <View key={index} style={styles.recipientCard}>
            <TextInput
              style={styles.input}
              value={recipient.name}
              onChangeText={(value) => updateRecipient(index, 'name', value)}
              placeholder="Recipient name"
            />
            <TextInput
              style={styles.input}
              value={recipient.walletId}
              onChangeText={(value) => updateRecipient(index, 'walletId', value)}
              placeholder="Wallet ID"
            />
            <TextInput
              style={styles.input}
              value={recipient.percentage.toString()}
              onChangeText={(value) => updateRecipient(index, 'percentage', parseInt(value) || 0)}
              placeholder="Percentage"
              keyboardType="numeric"
            />
            {recipients.length > 1 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeRecipient(index)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        
        <TouchableOpacity style={styles.addButton} onPress={addRecipient}>
          <Text style={styles.addButtonText}>Add Recipient</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Creating...' : 'Create Payment'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  recipientCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

### Wallet Dashboard

```tsx
// src/screens/WalletScreen.tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useWallets, usePaymentHistory } from '@corridor/react-native';

export function WalletScreen() {
  const { wallets, loading: walletsLoading, refresh: refreshWallets } = useWallets();
  const { payments, loading: paymentsLoading, refresh: refreshPayments } = usePaymentHistory({ limit: 10 });

  const onRefresh = async () => {
    await Promise.all([refreshWallets(), refreshPayments()]);
  };

  const renderWallet = ({ item: wallet }) => (
    <View style={styles.walletCard}>
      <View style={styles.walletHeader}>
        <Text style={styles.walletCurrency}>{wallet.currency}</Text>
        <Text style={styles.walletBalance}>
          {wallet.balance.toFixed(2)} {wallet.currency}
        </Text>
      </View>
    </View>
  );

  const renderPayment = ({ item: payment }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <Text style={styles.paymentMessage}>
          {payment.message || 'Payment'}
        </Text>
        <Text style={styles.paymentAmount}>
          {payment.amount} {payment.currency}
        </Text>
      </View>
      <View style={styles.paymentFooter}>
        <Text style={styles.paymentDate}>
          {new Date(payment.createdAt).toLocaleDateString()}
        </Text>
        <View style={[
          styles.statusBadge,
          payment.status === 'completed' && styles.completedBadge,
          payment.status === 'failed' && styles.failedBadge,
          payment.status === 'pending' && styles.pendingBadge,
        ]}>
          <Text style={styles.statusText}>{payment.status}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Balances</Text>
        <FlatList
          data={wallets}
          renderItem={renderWallet}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={walletsLoading}
              onRefresh={onRefresh}
            />
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <FlatList
          data={payments}
          renderItem={renderPayment}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={paymentsLoading}
              onRefresh={onRefresh}
            />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  walletCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  walletHeader: {
    alignItems: 'center',
  },
  walletCurrency: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentDate: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#D4F6D4',
  },
  failedBadge: {
    backgroundColor: '#FFD4D4',
  },
  pendingBadge: {
    backgroundColor: '#FFF4D4',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
```

## Push Notifications

```tsx
// src/services/NotificationService.ts
import messaging from '@react-native-firebase/messaging';
import { CorridorClient } from '@corridor/react-native';

class NotificationService {
  private client: CorridorClient;

  constructor(client: CorridorClient) {
    this.client = client;
  }

  async initialize() {
    // Request permission
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      // Get FCM token
      const token = await messaging().getToken();
      
      // Register device with Corridor
      await this.client.notifications.registerDevice({
        token,
        platform: 'mobile',
        type: 'fcm'
      });

      // Handle foreground messages
      messaging().onMessage(async remoteMessage => {
        this.handleCorridorNotification(remoteMessage);
      });

      // Handle background messages
      messaging().setBackgroundMessageHandler(async remoteMessage => {
        this.handleCorridorNotification(remoteMessage);
      });
    }
  }

  private handleCorridorNotification(message: any) {
    if (message.data?.source === 'corridor') {
      // Handle Corridor-specific notifications
      const { type, paymentId, goalId } = message.data;
      
      switch (type) {
        case 'payment_completed':
          this.showPaymentNotification(paymentId, 'Payment completed successfully');
          break;
        case 'goal_milestone':
          this.showGoalNotification(goalId, 'Goal milestone reached!');
          break;
      }
    }
  }

  private showPaymentNotification(paymentId: string, message: string) {
    // Show local notification or navigate to payment details
  }

  private showGoalNotification(goalId: string, message: string) {
    // Show local notification or navigate to goal details
  }
}

export default NotificationService;
```

## Offline Support

```tsx
// src/hooks/useOfflinePayments.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';
import { usePayments } from '@corridor/react-native';

interface PendingPayment {
  id: string;
  data: any;
  timestamp: number;
}

export function useOfflinePayments() {
  const { createSplitPayment } = usePayments();
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
      
      if (state.isConnected) {
        processPendingPayments();
      }
    });

    // Load pending payments on app start
    loadPendingPayments();

    return unsubscribe;
  }, []);

  const loadPendingPayments = async () => {
    try {
      const stored = await AsyncStorage.getItem('pendingPayments');
      if (stored) {
        setPendingPayments(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load pending payments:', error);
    }
  };

  const savePendingPayments = async (payments: PendingPayment[]) => {
    try {
      await AsyncStorage.setItem('pendingPayments', JSON.stringify(payments));
      setPendingPayments(payments);
    } catch (error) {
      console.error('Failed to save pending payments:', error);
    }
  };

  const queuePayment = async (paymentData: any) => {
    const pendingPayment: PendingPayment = {
      id: Date.now().toString(),
      data: paymentData,
      timestamp: Date.now(),
    };

    const updated = [...pendingPayments, pendingPayment];
    await savePendingPayments(updated);

    if (isOnline) {
      processPendingPayments();
    }

    return pendingPayment;
  };

  const processPendingPayments = async () => {
    if (pendingPayments.length === 0) return;

    const processed: string[] = [];

    for (const pending of pendingPayments) {
      try {
        await createSplitPayment(pending.data);
        processed.push(pending.id);
      } catch (error) {
        console.error('Failed to process pending payment:', error);
        // Keep in queue for retry
      }
    }

    if (processed.length > 0) {
      const remaining = pendingPayments.filter(p => !processed.includes(p.id));
      await savePendingPayments(remaining);
    }
  };

  return {
    queuePayment,
    pendingPayments,
    isOnline,
    processPendingPayments,
  };
}
```

## Testing

```tsx
// __tests__/SplitPaymentScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CorridorProvider } from '@corridor/react-native';
import { SplitPaymentScreen } from '../src/screens/SplitPaymentScreen';

const MockedCorridorProvider = ({ children }: { children: React.ReactNode }) => (
  <CorridorProvider apiKey="test-key" environment="sandbox">
    {children}
  </CorridorProvider>
);

describe('SplitPaymentScreen', () => {
  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <MockedCorridorProvider>
        <SplitPaymentScreen />
      </MockedCorridorProvider>
    );

    expect(getByText('Split Payment')).toBeTruthy();
    expect(getByPlaceholderText('0.00')).toBeTruthy();
    expect(getByPlaceholderText('Recipient name')).toBeTruthy();
  });

  it('adds recipient when add button is pressed', () => {
    const { getByText, getAllByPlaceholderText } = render(
      <MockedCorridorProvider>
        <SplitPaymentScreen />
      </MockedCorridorProvider>
    );

    fireEvent.press(getByText('Add Recipient'));
    
    expect(getAllByPlaceholderText('Recipient name')).toHaveLength(2);
  });

  it('validates percentage total before submission', async () => {
    const { getByText, getByPlaceholderText } = render(
      <MockedCorridorProvider>
        <SplitPaymentScreen />
      </MockedCorridorProvider>
    );

    fireEvent.changeText(getByPlaceholderText('0.00'), '100');
    fireEvent.changeText(getByPlaceholderText('Wallet ID'), 'wallet-123');
    fireEvent.changeText(getByPlaceholderText('Percentage'), '50');

    fireEvent.press(getByText('Create Payment'));

    // Should show error for invalid percentage total
    await waitFor(() => {
      // Test alert or error message
    });
  });
});
```

## Deployment

### iOS App Store

1. Update `ios/YourApp/Info.plist` with production API endpoints
2. Configure code signing and provisioning profiles
3. Build and archive in Xcode
4. Submit to App Store Connect

### Google Play Store

1. Update `android/app/build.gradle` with release configuration
2. Generate signed APK or AAB
3. Upload to Google Play Console
4. Submit for review

## Best Practices

1. **Offline Support**: Queue payments when offline and sync when online
2. **Push Notifications**: Notify users of payment status changes
3. **Biometric Auth**: Use TouchID/FaceID for sensitive operations
4. **Error Handling**: Provide clear error messages and retry options
5. **Performance**: Optimize list rendering with FlatList
6. **Security**: Store sensitive data in Keychain/Keystore

## Support

For React Native integration help:
- Email: mobile@corridormoney.net
- Documentation: https://docs.corridormoney.net/mobile
- GitHub: https://github.com/corridor/corridor-react-native