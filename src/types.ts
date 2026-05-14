import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  businessName?: string;
  address?: string;
  phone?: string;
  gstNumber?: string;
  createdAt: Timestamp;
}

export interface Medicine {
  id?: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  expiryDate: string;
  supplier: string;
  barcode?: string;
  description?: string;
  updatedAt: Timestamp;
}

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  totalSpent: number;
  lastPurchase?: Timestamp;
}

export interface BillItem {
  medicineId: string;
  name: string;
  quantity: number;
  price: number;
  gstPercent: number;
  discountPercent?: number;
  subtotal: number;
}

export type PaymentMethod = 'cash' | 'upi' | 'card';

export interface Bill {
  id?: string;
  billNumber: string;
  customerId?: string | null;
  customerName: string;
  customerPhone?: string;
  items: BillItem[];
  totalAmount: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  discount: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  staffId: string;
  createdAt: Timestamp;
}

export interface DailyReport {
  id?: string;
  date: string;
  totalSales: number;
  totalOrders: number;
  totalProfit: number;
  topSellingMedicines: { name: string; count: number }[];
}
