export const SHIPPING_FEE = 49;
export const FREE_SHIPPING_ABOVE = 999;
export const UPI_ID = "abubackerfayaz-1@oksbi";

export interface CheckoutDetails {
  name: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pinCode: string;
}

export type CheckoutDetailErrors = Partial<Record<keyof CheckoutDetails, string>>;

export const EMPTY_DETAILS: CheckoutDetails = {
  name: "",
  phone: "",
  email: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pinCode: "",
};

export function calcShipping(subtotal: number): number {
  if (subtotal <= 0 || subtotal >= FREE_SHIPPING_ABOVE) return 0;
  return SHIPPING_FEE;
}

export function validateDetails(d: CheckoutDetails): CheckoutDetailErrors {
  const errors: CheckoutDetailErrors = {};
  const name = d.name.trim();
  const phone = d.phone.replace(/\D/g, "");
  const email = d.email.trim();
  const line1 = d.line1.trim();
  const city = d.city.trim();
  const state = d.state.trim();
  const pinCode = d.pinCode.replace(/\D/g, "");

  if (name.length < 2) errors.name = "Enter your full name";
  else if (name.length > 80) errors.name = "Name is too long";

  if (!/^[6-9]\d{9}$/.test(phone)) errors.phone = "Enter a valid 10-digit mobile number";

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    errors.email = "Enter a valid email address";

  if (line1.length < 3) errors.line1 = "Enter your street address";
  else if (line1.length > 120) errors.line1 = "Address is too long";

  if (city.length < 2) errors.city = "Enter city";
  if (state.length < 2) errors.state = "Enter state";
  if (!/^\d{6}$/.test(pinCode)) errors.pinCode = "Enter a 6-digit PIN code";

  return errors;
}

const DETAILS_STORAGE_KEY = "slaggy-checkout-details-v1";

export function loadDetails(): CheckoutDetails | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DETAILS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CheckoutDetails>;
    if (!parsed || typeof parsed !== "object") return null;
    return { ...EMPTY_DETAILS, ...parsed };
  } catch {
    return null;
  }
}

export function saveDetails(details: CheckoutDetails): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DETAILS_STORAGE_KEY, JSON.stringify(details));
  } catch {
    /* storage unavailable */
  }
}

export interface OrderPayloadItem {
  productId: string;
  variantId?: string;
  size: string;
  color?: string | null;
  quantity: number;
}

export interface OrderPayload {
  customer: { name: string; phone: string; email: string };
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pinCode: string;
  };
  items: OrderPayloadItem[];
  paymentMethod: "UPI";
}

export interface PlacedOrder {
  orderNumber: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  itemCount: number;
  createdAt: string;
}

export async function placeOrder(payload: OrderPayload): Promise<PlacedOrder> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data: { error?: string; order?: PlacedOrder } | null = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok || !data?.order) {
    throw new Error(
      data?.error || "Could not place your order. Please check your details and try again."
    );
  }
  return data.order;
}
