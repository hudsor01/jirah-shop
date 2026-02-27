export type OrderLineItem = {
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type ShippingAddress = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type OrderEmailProps = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderLineItem[];
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  couponCode: string | null;
  shippingAddress: ShippingAddress;
  orderDate: string;
};

export type ContactEmailProps = {
  name: string;
  email: string;
  subject: string | null;
  message: string;
};

export type OrderStatusEmailProps = {
  orderNumber: string;
  customerName: string;
  newStatus: string;
  statusMessage: string;
  trackingUrl?: string;
};
