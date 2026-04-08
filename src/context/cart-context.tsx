"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { Product } from "@/types/product";

interface CartItem {
  product: Product;
  quantity: number;
}

interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  paymentMode: string;
  address: Address;
  status: "Placed" | "Packed" | "Shipped";
  createdAt: string;
}

interface Activity {
  id: string;
  message: string;
  createdAt: string;
}

interface UserProfile {
  fullName: string;
  phone: string;
}

interface CartContextValue {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  orders: Order[];
  addresses: Address[];
  activities: Activity[];
  profile: UserProfile;
  addToCart: (product: Product) => void;
  buyNow: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  addAddress: (address: Omit<Address, "id">) => Address;
  updateProfile: (profile: UserProfile) => void;
  placeOrder: (input: { paymentMode: string; address: Address }) => string;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const KEY_CART = "techkart_cart";
const KEY_ORDERS = "techkart_orders";
const KEY_ADDR = "techkart_addresses";
const KEY_ACT = "techkart_activities";
const KEY_PROFILE = "techkart_profile";
const EMPTY_CART: CartItem[] = [];
const EMPTY_ORDERS: Order[] = [];
const EMPTY_ADDR: Address[] = [];
const EMPTY_ACT: Activity[] = [];
const EMPTY_PROFILE: UserProfile = { fullName: "", phone: "" };

const storeCache = new Map<string, { raw: string | null; parsed: unknown }>();

function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);
    const cached = storeCache.get(key);

    if (cached && cached.raw === raw) {
      return cached.parsed as T;
    }

    const parsed = raw ? (JSON.parse(raw) as T) : fallback;
    storeCache.set(key, { raw, parsed });
    return parsed;
  } catch {
    return fallback;
  }
}

function writeStore<T>(key: string, value: T) {
  const raw = JSON.stringify(value);
  storeCache.set(key, { raw, parsed: value });
  localStorage.setItem(key, raw);
  window.dispatchEvent(new Event(`techkart-store:${key}`));
}

function subscribeKey(key: string, callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === key) {
      callback();
    }
  };

  const onInternal = () => callback();
  const evt = `techkart-store:${key}`;

  window.addEventListener("storage", onStorage);
  window.addEventListener(evt, onInternal);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(evt, onInternal);
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cartItems = useSyncExternalStore(
    (cb) => subscribeKey(KEY_CART, cb),
    () => readStore<CartItem[]>(KEY_CART, EMPTY_CART),
    () => EMPTY_CART,
  );

  const orders = useSyncExternalStore(
    (cb) => subscribeKey(KEY_ORDERS, cb),
    () => readStore<Order[]>(KEY_ORDERS, EMPTY_ORDERS),
    () => EMPTY_ORDERS,
  );

  const addresses = useSyncExternalStore(
    (cb) => subscribeKey(KEY_ADDR, cb),
    () => readStore<Address[]>(KEY_ADDR, EMPTY_ADDR),
    () => EMPTY_ADDR,
  );

  const activities = useSyncExternalStore(
    (cb) => subscribeKey(KEY_ACT, cb),
    () => readStore<Activity[]>(KEY_ACT, EMPTY_ACT),
    () => EMPTY_ACT,
  );

  const profile = useSyncExternalStore(
    (cb) => subscribeKey(KEY_PROFILE, cb),
    () => readStore<UserProfile>(KEY_PROFILE, EMPTY_PROFILE),
    () => EMPTY_PROFILE,
  );

  const value = useMemo<CartContextValue>(() => {
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = cartItems.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0,
    );

    const addActivity = (message: string) => {
      const next: Activity[] = [
        {
          id: crypto.randomUUID(),
          message,
          createdAt: new Date().toISOString(),
        },
        ...readStore<Activity[]>(KEY_ACT, []),
      ];
      writeStore(KEY_ACT, next);
    };

    return {
      cartItems,
      cartCount,
      cartTotal,
      orders,
      addresses,
      activities,
      profile,
      addToCart: (product) => {
        const prev = readStore<CartItem[]>(KEY_CART, []);
        const found = prev.find((item) => item.product.id === product.id);
        const next = found
          ? prev.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            )
          : [...prev, { product, quantity: 1 }];
        writeStore(KEY_CART, next);
        addActivity(`Added ${product.name} to cart`);
      },
      buyNow: (product) => {
        writeStore(KEY_CART, [{ product, quantity: 1 }]);
        addActivity(`Started Buy Now for ${product.name}`);
      },
      removeFromCart: (productId) => {
        const prev = readStore<CartItem[]>(KEY_CART, []);
        writeStore(
          KEY_CART,
          prev.filter((item) => item.product.id !== productId),
        );
      },
      updateQuantity: (productId, quantity) => {
        const prev = readStore<CartItem[]>(KEY_CART, []);
        const next = prev
          .map((item) =>
            item.product.id === productId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item,
          )
          .filter((item) => item.quantity > 0);
        writeStore(KEY_CART, next);
      },
      clearCart: () => writeStore<CartItem[]>(KEY_CART, []),
      addAddress: (addressInput) => {
        const address: Address = { id: crypto.randomUUID(), ...addressInput };
        const prev = readStore<Address[]>(KEY_ADDR, []);
        writeStore(KEY_ADDR, [address, ...prev]);
        addActivity(`Saved address for ${address.fullName}`);
        return address;
      },
      updateProfile: (nextProfile) => {
        writeStore(KEY_PROFILE, nextProfile);
        addActivity("Updated profile details");
      },
      placeOrder: ({ paymentMode, address }) => {
        const currentCart = readStore<CartItem[]>(KEY_CART, []);
        const total = currentCart.reduce(
          (acc, item) => acc + item.product.price * item.quantity,
          0,
        );
        const orderId = `TK-${Date.now().toString().slice(-8)}`;
        const nextOrder: Order = {
          id: orderId,
          items: currentCart,
          total,
          paymentMode,
          address,
          status: "Placed",
          createdAt: new Date().toISOString(),
        };
        const prevOrders = readStore<Order[]>(KEY_ORDERS, []);
        writeStore(KEY_ORDERS, [nextOrder, ...prevOrders]);
        writeStore<CartItem[]>(KEY_CART, []);
        addActivity(`Placed order ${orderId} via ${paymentMode}`);
        return orderId;
      },
    };
  }, [activities, addresses, cartItems, orders, profile]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
