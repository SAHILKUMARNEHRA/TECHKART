"use client";

import { createContext, useContext, useMemo, useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  setDoc,
  where,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "./auth-context";
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
  const { user, isAdmin } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => readStore(KEY_CART, EMPTY_CART));
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>(() => readStore(KEY_ADDR, EMPTY_ADDR));
  const [activities, setActivities] = useState<Activity[]>([]);
  const [profile, setProfile] = useState<UserProfile>(() => readStore(KEY_PROFILE, EMPTY_PROFILE));

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    // Activities: Global if admin, otherwise user-specific
    const actQuery = isAdmin 
      ? query(collection(db, "activities"), orderBy("createdAt", "desc"), limit(50))
      : query(collection(db, "activities"), where("userId", "==", user?.uid || "guest"), orderBy("createdAt", "desc"), limit(20));
    
    const unsubAct = onSnapshot(actQuery, (snap) => {
      setActivities(snap.docs.map(doc => doc.data() as Activity));
    });

    // Orders: Global if admin, otherwise user-specific
    const orderQuery = isAdmin
      ? query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(100))
      : query(collection(db, "orders"), where("userId", "==", user?.uid || "guest"), orderBy("createdAt", "desc"));

    const unsubOrders = onSnapshot(orderQuery, (snap) => {
      setOrders(snap.docs.map(doc => doc.data() as Order));
    });

    return () => {
      unsubAct();
      unsubOrders();
    };
  }, [user, isAdmin]);

  const value = useMemo<CartContextValue>(() => {
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = cartItems.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0,
    );

    const addActivity = async (message: string) => {
      const activity: Activity & { userId: string } = {
        id: crypto.randomUUID(),
        message,
        createdAt: new Date().toISOString(),
        userId: user?.uid || "guest"
      };
      
      if (isFirebaseConfigured) {
        try {
          await setDoc(doc(db, "activities", activity.id), activity);
        } catch (e) {
          console.error("Error saving activity:", e);
        }
      }
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
        const prev = readStore<CartItem[]>(KEY_CART, EMPTY_CART);
        const found = prev.find((item) => item.product.id === product.id);
        const next = found
          ? prev.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            )
          : [...prev, { product, quantity: 1 }];
        writeStore(KEY_CART, next);
        setCartItems(next);
        addActivity(`Added ${product.name} to cart`);
      },
      buyNow: (product) => {
        const next = [{ product, quantity: 1 }];
        writeStore(KEY_CART, next);
        setCartItems(next);
        addActivity(`Started Buy Now for ${product.name}`);
      },
      removeFromCart: (productId) => {
        const prev = readStore<CartItem[]>(KEY_CART, EMPTY_CART);
        const next = prev.filter((item) => item.product.id !== productId);
        writeStore(KEY_CART, next);
        setCartItems(next);
      },
      updateQuantity: (productId, quantity) => {
        const prev = readStore<CartItem[]>(KEY_CART, EMPTY_CART);
        const next = prev
          .map((item) =>
            item.product.id === productId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item,
          )
          .filter((item) => item.quantity > 0);
        writeStore(KEY_CART, next);
        setCartItems(next);
      },
      clearCart: () => {
        writeStore<CartItem[]>(KEY_CART, EMPTY_CART);
        setCartItems(EMPTY_CART);
      },
      addAddress: (addressInput) => {
        const address: Address = { id: crypto.randomUUID(), ...addressInput };
        const prev = readStore<Address[]>(KEY_ADDR, EMPTY_ADDR);
        const next = [address, ...prev];
        writeStore(KEY_ADDR, next);
        setAddresses(next);
        addActivity(`Saved address for ${address.fullName}`);
        return address;
      },
      updateProfile: (nextProfile) => {
        writeStore(KEY_PROFILE, nextProfile);
        setProfile(nextProfile);
        addActivity("Updated profile details");
      },
      placeOrder: ({ paymentMode, address }) => {
        const currentCart = readStore<CartItem[]>(KEY_CART, EMPTY_CART);
        const total = currentCart.reduce(
          (acc, item) => acc + item.product.price * item.quantity,
          0,
        );
        const orderId = `TK-${Date.now().toString().slice(-8)}`;
        const nextOrder: Order & { userId: string } = {
          id: orderId,
          userId: user?.uid || "guest",
          items: currentCart,
          total,
          paymentMode,
          address,
          status: "Placed",
          createdAt: new Date().toISOString(),
        };
        
        if (isFirebaseConfigured) {
          setDoc(doc(db, "orders", orderId), nextOrder).catch(console.error);
        }

        writeStore<CartItem[]>(KEY_CART, EMPTY_CART);
        setCartItems(EMPTY_CART);
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
