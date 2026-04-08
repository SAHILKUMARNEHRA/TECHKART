"use client";

import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import { CompareProvider } from "@/context/compare-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <CompareProvider>{children}</CompareProvider>
      </CartProvider>
    </AuthProvider>
  );
}
