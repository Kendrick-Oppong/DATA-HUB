import {
  DataBundle,
  Order,
  Transaction,
  ResultCheckerProduct,
  AfaApplication,
  Complaint,
  AgentStoreConfig,
  PayoutRequest,
  BulkSmsCampaign,
  TelecomNetwork,
  TelecomGateway
} from './types';

export const INITIAL_BUNDLES: DataBundle[] = [
  // MTN Ghana Bundles (Non-expiry & Turbonet)
  {
    id: 'mtn-1gb',
    network: 'MTN',
    name: 'MTN Non-Expiry 1GB',
    sizeGb: 1,
    sizeLabel: '1 GB',
    validity: 'Non-Expiry',
    wholesalePrice: 4.80,
    retailPrice: 5.50,
    category: 'non_expiry',
    isPopular: false
  },
  {
    id: 'mtn-2.5gb',
    network: 'MTN',
    name: 'MTN Non-Expiry 2.5GB',
    sizeGb: 2.5,
    sizeLabel: '2.5 GB',
    validity: 'Non-Expiry',
    wholesalePrice: 10.50,
    retailPrice: 12.00,
    category: 'non_expiry',
    isPopular: true
  },
  {
    id: 'mtn-5gb',
    network: 'MTN',
    name: 'MTN Non-Expiry 5GB',
    sizeGb: 5,
    sizeLabel: '5 GB',
    validity: 'Non-Expiry',
    wholesalePrice: 19.50,
    retailPrice: 22.50,
    category: 'non_expiry',
    isPopular: true
  },
  {
    id: 'mtn-10gb',
    network: 'MTN',
    name: 'MTN Non-Expiry 10GB',
    sizeGb: 10,
    sizeLabel: '10 GB',
    validity: 'Non-Expiry',
    wholesalePrice: 38.00,
    retailPrice: 43.00,
    category: 'non_expiry',
    isPopular: true
  },
  {
    id: 'mtn-20gb',
    network: 'MTN',
    name: 'MTN Super Non-Expiry 20GB',
    sizeGb: 20,
    sizeLabel: '20 GB',
    validity: 'Non-Expiry',
    wholesalePrice: 72.00,
    retailPrice: 82.00,
    category: 'non_expiry',
    isPopular: false
  },
  {
    id: 'mtn-50gb',
    network: 'MTN',
    name: 'MTN Mega Fiber/Turbonet 50GB',
    sizeGb: 50,
    sizeLabel: '50 GB',
    validity: '60 Days',
    wholesalePrice: 165.00,
    retailPrice: 185.00,
    category: 'turbonet',
    isPopular: false
  },
  {
    id: 'mtn-100gb',
    network: 'MTN',
    name: 'MTN Enterprise Turbonet 100GB',
    sizeGb: 100,
    sizeLabel: '100 GB',
    validity: '90 Days',
    wholesalePrice: 310.00,
    retailPrice: 350.00,
    category: 'turbonet',
    isPopular: false
  },

  // Telecel Ghana Bundles (formerly Vodafone)
  {
    id: 'telecel-1.5gb',
    network: 'Telecel',
    name: 'Telecel Bossu 1.5GB',
    sizeGb: 1.5,
    sizeLabel: '1.5 GB',
    validity: '30 Days',
    wholesalePrice: 5.20,
    retailPrice: 6.00,
    category: 'non_expiry',
    isPopular: false
  },
  {
    id: 'telecel-5gb',
    network: 'Telecel',
    name: 'Telecel Extra 5GB',
    sizeGb: 5,
    sizeLabel: '5 GB',
    validity: '30 Days',
    wholesalePrice: 17.50,
    retailPrice: 20.00,
    category: 'non_expiry',
    isPopular: true
  },
  {
    id: 'telecel-10gb',
    network: 'Telecel',
    name: 'Telecel Extra 10GB',
    sizeGb: 10,
    sizeLabel: '10 GB',
    validity: '30 Days',
    wholesalePrice: 34.00,
    retailPrice: 39.00,
    category: 'non_expiry',
    isPopular: true
  },
  {
    id: 'telecel-25gb',
    network: 'Telecel',
    name: 'Telecel Heavy Surfer 25GB',
    sizeGb: 25,
    sizeLabel: '25 GB',
    validity: '60 Days',
    wholesalePrice: 80.00,
    retailPrice: 92.00,
    category: 'special',
    isPopular: false
  },
  {
    id: 'telecel-50gb',
    network: 'Telecel',
    name: 'Telecel Maxi Ultra 50GB',
    sizeGb: 50,
    sizeLabel: '50 GB',
    validity: '60 Days',
    wholesalePrice: 155.00,
    retailPrice: 175.00,
    category: 'special',
    isPopular: false
  },

  // AirtelTigo / AT Bundles (Big Time & Sika)
  {
    id: 'at-2gb',
    network: 'AirtelTigo',
    name: 'AT Big Time 2GB',
    sizeGb: 2,
    sizeLabel: '2 GB',
    validity: 'Non-Expiry',
    wholesalePrice: 6.50,
    retailPrice: 7.50,
    category: 'non_expiry',
    isPopular: false
  },
  {
    id: 'at-5gb',
    network: 'AirtelTigo',
    name: 'AT Sika Data 5GB',
    sizeGb: 5,
    sizeLabel: '5 GB',
    validity: 'Non-Expiry',
    wholesalePrice: 16.00,
    retailPrice: 18.50,
    category: 'sika',
    isPopular: true
  },
  {
    id: 'at-10gb',
    network: 'AirtelTigo',
    name: 'AT Sika Mega 10GB',
    sizeGb: 10,
    sizeLabel: '10 GB',
    validity: 'Non-Expiry',
    wholesalePrice: 30.00,
    retailPrice: 35.00,
    category: 'sika',
    isPopular: true
  },
  {
    id: 'at-30gb',
    network: 'AirtelTigo',
    name: 'AT Unlimited Surfer 30GB',
    sizeGb: 30,
    sizeLabel: '30 GB',
    validity: '30 Days',
    wholesalePrice: 85.00,
    retailPrice: 98.00,
    category: 'special',
    isPopular: false
  }
];

export const INITIAL_CHECKERS: ResultCheckerProduct[] = [
  {
    id: 'waec-wassce',
    title: 'WASSCE Result Checker 2026',
    examBody: 'WAEC',
    price: 24.00,
    stockCount: 420,
    description: 'Instant serial & PIN code to check WASSCE school and private results on waecdirect.org'
  },
  {
    id: 'cssps-bece',
    title: 'BECE Placement Checker 2026',
    examBody: 'CSSPS',
    price: 15.00,
    stockCount: 810,
    description: 'Computerized School Selection and Placement System (CSSPS) Senior High Placement voucher'
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    reference: 'SDH-GH-2026-94812',
    date: '2026-09-11 15:42',
    customerName: 'Kojo Mensah',
    recipientPhone: '0244192834',
    network: 'MTN',
    serviceType: 'data',
    productName: 'MTN Non-Expiry 5GB',
    amount: 22.50,
    paymentMethod: 'wallet',
    status: 'delivered',
    agentMargin: 3.00,
    deliveryTimeline: [
      { step: 'Order Placed', timestamp: '15:42:01', status: 'completed', note: 'Paid via SDH Wallet' },
      { step: 'Upstream Dispatch', timestamp: '15:42:04', status: 'completed', note: 'MTN Direct Core Gateway' },
      { step: 'Network Acknowledged', timestamp: '15:42:09', status: 'completed', note: 'Batch ID: MTN-ACC-83921' },
      { step: 'Delivered to Beneficiary', timestamp: '15:42:15', status: 'completed', note: 'Customer balance credited' }
    ]
  },
  {
    id: 'ord-1002',
    reference: 'SDH-GH-2026-94813',
    date: '2026-09-11 16:15',
    customerName: 'Akosua Serwaa',
    recipientPhone: '0502847192',
    network: 'Telecel',
    serviceType: 'data',
    productName: 'Telecel Extra 10GB',
    amount: 39.00,
    paymentMethod: 'momo_telecel',
    status: 'delivered',
    agentMargin: 5.00,
    deliveryTimeline: [
      { step: 'Order Placed', timestamp: '16:15:02', status: 'completed', note: 'Paid via Telecel Cash' },
      { step: 'Upstream Dispatch', timestamp: '16:15:06', status: 'completed', note: 'Telecel Business E-Load' },
      { step: 'Delivered to Beneficiary', timestamp: '16:15:18', status: 'completed', note: 'Delivered' }
    ]
  },
  {
    id: 'ord-1003',
    reference: 'SDH-GH-2026-94814',
    date: '2026-09-11 16:30',
    customerName: 'Emmanuel Osei',
    recipientPhone: '0249821034',
    network: 'MTN',
    serviceType: 'checker',
    productName: 'WASSCE Result Checker 2026',
    amount: 24.00,
    paymentMethod: 'wallet',
    status: 'delivered',
    voucherCode: '9841-2094-1849',
    voucherSerial: 'W26-849102',
    deliveryTimeline: [
      { step: 'Order Placed', timestamp: '16:30:10', status: 'completed' },
      { step: 'Voucher Generated', timestamp: '16:30:12', status: 'completed', note: 'Delivered to customer drawer' }
    ]
  },
  {
    id: 'ord-1004',
    reference: 'SDH-GH-2026-94815',
    date: '2026-09-11 16:50',
    customerName: 'Yaw Boateng',
    recipientPhone: '0553920194',
    network: 'MTN',
    serviceType: 'data',
    productName: 'MTN Non-Expiry 2.5GB',
    amount: 12.00,
    paymentMethod: 'momo_mtn',
    status: 'processing',
    deliveryTimeline: [
      { step: 'Order Placed', timestamp: '16:50:04', status: 'completed', note: 'MTN MoMo Debit Verified' },
      { step: 'Upstream Dispatch', timestamp: '16:50:08', status: 'completed', note: 'Queued at MTN EVD' },
      { step: 'Network Acknowledged', timestamp: '16:50:22', status: 'current', note: 'Awaiting network SMS confirm' },
      { step: 'Delivered to Beneficiary', timestamp: 'Pending', status: 'pending' }
    ]
  },
  {
    id: 'ord-1005',
    reference: 'SDH-GH-2026-94816',
    date: '2026-09-11 16:58',
    customerName: 'Priscilla Addo',
    recipientPhone: '0277382910',
    network: 'AirtelTigo',
    serviceType: 'airtime',
    productName: 'AT Airtime Top-up',
    amount: 20.00,
    paymentMethod: 'wallet',
    status: 'delivered',
    deliveryTimeline: [
      { step: 'Order Placed', timestamp: '16:58:00', status: 'completed' },
      { step: 'E-Load Dispatched', timestamp: '16:58:03', status: 'completed' },
      { step: 'Delivered', timestamp: '16:58:08', status: 'completed', note: 'GH₵20.00 Credited' }
    ]
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-501',
    reference: 'TX-SDH-84910',
    date: '2026-09-11 14:10',
    type: 'credit',
    category: 'wallet_funding',
    amount: 150.00,
    fee: 1.50,
    balanceAfter: 245.50,
    description: 'MTN MoMo Wallet Top-up (0244192834)',
    status: 'completed',
    channel: 'MTN Mobile Money'
  },
  {
    id: 'tx-502',
    reference: 'TX-SDH-84911',
    date: '2026-09-11 15:42',
    type: 'debit',
    category: 'purchase',
    amount: 22.50,
    fee: 0.00,
    balanceAfter: 223.00,
    description: 'Purchase MTN 5GB for 0244192834',
    status: 'completed',
    channel: 'SDH Wallet'
  },
  {
    id: 'tx-503',
    reference: 'TX-SDH-84912',
    date: '2026-09-11 16:30',
    type: 'debit',
    category: 'purchase',
    amount: 24.00,
    fee: 0.00,
    balanceAfter: 199.00,
    description: 'WASSCE Result Checker purchase',
    status: 'completed',
    channel: 'SDH Wallet'
  },
  {
    id: 'tx-504',
    reference: 'TX-SDH-84913',
    date: '2026-09-11 16:58',
    type: 'debit',
    category: 'purchase',
    amount: 20.00,
    fee: 0.00,
    balanceAfter: 179.00,
    description: 'AT Airtime Top-up for 0277382910',
    status: 'completed',
    channel: 'SDH Wallet'
  }
];

export const INITIAL_AFA: AfaApplication[] = [
  {
    id: 'afa-01',
    reference: 'AFA-GH-9382',
    fullName: 'Kwame Agyapong',
    phoneNumber: '0243920194',
    ghanaCardNumber: 'GHA-728192834-1',
    region: 'Ashanti',
    occupation: 'Farmer / Agribusiness',
    dateSubmitted: '2026-09-10 11:30',
    status: 'approved',
    fee: 50.00,
    notes: 'National ID verified successfully. Tariff activated.'
  },
  {
    id: 'afa-02',
    reference: 'AFA-GH-9383',
    fullName: 'Gifty Mensah',
    phoneNumber: '0558291034',
    ghanaCardNumber: 'GHA-829103847-9',
    region: 'Greater Accra',
    occupation: 'Produce Trader',
    dateSubmitted: '2026-09-11 09:15',
    status: 'under_review',
    fee: 50.00,
    notes: 'Awaiting biometric checksum from MoFA portal.'
  }
];

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'cmp-01',
    ticketNumber: 'TKT-SDH-1049',
    orderReference: 'SDH-GH-2026-94814',
    category: 'delivery_delay',
    subject: 'MTN 2.5GB delivery taking longer than 5 minutes',
    status: 'investigating',
    priority: 'high',
    createdAt: '2026-09-11 16:52',
    lastUpdated: '2026-09-11 16:56',
    messages: [
      {
        id: 'm1',
        sender: 'customer',
        senderName: 'Yaw Boateng',
        text: 'Hello, my MoMo was debited GH₵12 for the 2.5GB bundle but beneficiary has not received the SMS yet.',
        timestamp: '16:52'
      },
      {
        id: 'm2',
        sender: 'support_admin',
        senderName: 'SDH NOC Support (Abena)',
        text: 'Hi Yaw, we see MTN Ghana experienced a brief gateway queue between 16:48 and 16:55. Your order SDH-GH-2026-94814 is in the active dispatch queue. It will complete in 2-3 minutes. If it fails, our system automatically refunds your wallet.',
        timestamp: '16:56'
      }
    ]
  }
];

export const INITIAL_STORE_CONFIG: AgentStoreConfig = {
  agentName: 'Kofi Owusu',
  storeName: 'Kofi Telecom Express',
  handle: 'kofi-telecom',
  tagline: 'Instant Non-Expiry Data & Exam Vouchers in Ghana',
  announcement: '🔥 Fast delivery within 60 seconds! 24/7 WhatsApp customer support.',
  whatsappNumber: '0244192834',
  phone: '0244192834',
  email: 'kofitelecom@gmail.com',
  status: 'published',
  themeColor: '#2563eb',
  bannerGradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
  defaultNetwork: 'MTN',
  marginMarkupPercent: 8,
  customPrices: {
    'mtn-1gb': 5.50,
    'mtn-2.5gb': 12.00,
    'mtn-5gb': 22.50,
    'mtn-10gb': 43.00,
    'telecel-5gb': 20.00,
    'telecel-10gb': 39.00,
    'at-5gb': 18.50,
    'at-10gb': 35.00
  },
  allowGuestCheckout: true,
  promoCodes: [
    { code: 'KOFI10', discountPercent: 5, active: true },
    { code: 'STUDENT', discountPercent: 3, active: true }
  ]
};

export const INITIAL_PAYOUTS: PayoutRequest[] = [
  {
    id: 'pay-01',
    reference: 'PAY-SDH-3910',
    agentId: 'ag-kofi',
    agentName: 'Kofi Owusu (Kofi Telecom)',
    amount: 350.00,
    fee: 3.50,
    netAmount: 346.50,
    momoNetwork: 'MTN',
    momoNumber: '0244192834',
    accountName: 'Kofi Owusu',
    requestDate: '2026-09-11 11:20',
    status: 'approved',
    riskScore: 'low',
    notes: 'Regular agent, high volume, 0 chargebacks.'
  },
  {
    id: 'pay-02',
    reference: 'PAY-SDH-3911',
    agentId: 'ag-efya',
    agentName: 'Efya Mensah (Accra Data Hub)',
    amount: 820.00,
    fee: 8.20,
    netAmount: 811.80,
    momoNetwork: 'Telecel',
    momoNumber: '0501829304',
    accountName: 'Efya Mensah',
    requestDate: '2026-09-11 14:45',
    status: 'pending',
    riskScore: 'low',
    notes: 'KYC Verified agent. 32 orders delivered today.'
  }
];

export const INITIAL_SMS_CAMPAIGNS: BulkSmsCampaign[] = [
  {
    id: 'sms-01',
    title: 'Weekend Promo Special',
    senderId: 'KOFIDATA',
    message: 'Hello valued customer! Enjoy 10GB MTN data for just GH₵43 today only at smartdatahub.com/store/kofi-telecom. Instant delivery.',
    recipientCount: 145,
    costPerSms: 0.05,
    totalCost: 7.25,
    pagesPerSms: 1,
    dateCreated: '2026-09-10 09:00',
    status: 'sent',
    deliveryRatePercent: 98.6
  }
];

export const INITIAL_GATEWAYS: TelecomGateway[] = [
  {
    id: 'gw-mtn-evd',
    name: 'MTN Ghana EVD Dispatch',
    network: 'MTN',
    status: 'online',
    latencyMs: 42,
    successRate: 99.8,
    lastPing: 'Just now'
  },
  {
    id: 'gw-telecel-api',
    name: 'Telecel Ghana Core Switch',
    network: 'Telecel',
    status: 'online',
    latencyMs: 65,
    successRate: 99.4,
    lastPing: '1s ago'
  },
  {
    id: 'gw-at-direct',
    name: 'AirtelTigo / AT Fast Switch',
    network: 'AirtelTigo',
    status: 'online',
    latencyMs: 58,
    successRate: 98.9,
    lastPing: '2s ago'
  },
  {
    id: 'gw-waec-host',
    name: 'WAEC National Examinations Server',
    network: 'WAEC',
    status: 'online',
    latencyMs: 110,
    successRate: 99.1,
    lastPing: '5s ago'
  },
  {
    id: 'gw-mofa-afa',
    name: 'Ministry of Food & Agric (AFA Portal)',
    network: 'MOFA',
    status: 'online',
    latencyMs: 145,
    successRate: 97.8,
    lastPing: '12s ago'
  },
  {
    id: 'gw-ecg-power',
    name: 'ECG PowerApp Prepaid Gateway',
    network: 'ECG',
    status: 'online',
    latencyMs: 88,
    successRate: 99.2,
    lastPing: '3s ago'
  }
];

// Convenience Aliases
export const initialBundles = INITIAL_BUNDLES;
export const mockOrders = INITIAL_ORDERS;
export const mockTransactions = INITIAL_TRANSACTIONS;
export const mockAfaApplications = INITIAL_AFA;
export const mockResultCheckers = INITIAL_CHECKERS;
export const mockGateways = INITIAL_GATEWAYS;
export const mockAgentStore = INITIAL_STORE_CONFIG;
export const mockComplaints = INITIAL_COMPLAINTS;

// Ghana Telecom network auto-detection helper
export function detectGhanaNetwork(phone: string): TelecomNetwork {
  const cleaned = phone.replace(/\D/g, '');
  const prefix = cleaned.startsWith('233') ? '0' + cleaned.slice(3, 5) : cleaned.slice(0, 3);

  // MTN Prefixes: 024, 054, 055, 059, 053
  if (['024', '054', '055', '059', '053'].includes(prefix)) {
    return 'MTN';
  }
  // Telecel Prefixes: 020, 050
  if (['020', '050'].includes(prefix)) {
    return 'Telecel';
  }
  // AirtelTigo / AT Prefixes: 027, 057, 026, 056
  if (['027', '057', '026', '056'].includes(prefix)) {
    return 'AirtelTigo';
  }
  return 'MTN'; // Default fallback
}

// Local Storage Helper with Fallback
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`sdh_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`sdh_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error', e);
  }
}
