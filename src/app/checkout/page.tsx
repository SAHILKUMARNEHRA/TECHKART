"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useCart } from "@/context/cart-context";
import { formatINR } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, cartTotal, addAddress, addresses, placeOrder } = useCart();
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [selectedAddressId, setSelectedAddressId] = useState(addresses[0]?.id ?? "");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });
  const deliveryDays = 2 + (cartItems.length % 3);
  const shippingFee = cartTotal > 24999 ? 0 : 99;
  const payable = cartTotal + shippingFee;

  if (cartItems.length === 0) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center">Cart is empty.</div>;
  }

  const onPlaceOrder = (event: FormEvent) => {
    event.preventDefault();
    let finalAddress = addresses.find((item) => item.id === selectedAddressId);
    if (!finalAddress) {
      finalAddress = addAddress(form);
    }
    const orderId = placeOrder({ paymentMode, address: finalAddress });
    router.push(`/orders/${orderId}`);
  };

  return (
    <form onSubmit={onPlaceOrder} className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
          <h1 className="text-lg font-bold text-blue-900">Checkout</h1>
          <p className="text-sm text-blue-700">
            Delivery in {deliveryDays} days. Trusted branded products only.
          </p>
        </div>
        <h2 className="text-lg font-semibold">Delivery Address</h2>
        {addresses.length > 0 ? (
          <select value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)} className="w-full rounded border p-2 text-sm">
            <option value="">Add New Address</option>
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.fullName}, {address.city} ({address.pincode})
              </option>
            ))}
          </select>
        ) : null}

        {!selectedAddressId ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(form).map(([key, value]) => (
              <input
                key={key}
                required
                value={value}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={key}
                className="rounded border p-2 text-sm"
              />
            ))}
          </div>
        ) : null}

        <h2 className="pt-2 text-lg font-semibold">Payment Method</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          {["UPI", "Card", "NetBanking", "Cash on Delivery"].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setPaymentMode(mode)}
              className={`rounded-lg px-3 py-1.5 font-semibold ${paymentMode === mode ? "bg-blue-600 text-white" : "bg-slate-100"}`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="pt-3">
          <h3 className="text-base font-semibold">Items You Are Buying</h3>
          <div className="mt-3 space-y-3">
            {cartItems.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-slate-100">
                  <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="64px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold text-slate-800">{item.product.name}</p>
                  <p className="text-xs text-slate-500">{item.product.brand}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                  <p className="text-sm font-semibold text-slate-900">{formatINR(item.product.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Order Summary</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between text-slate-600">
            <span>Items ({cartItems.length})</span>
            <span>{formatINR(cartTotal)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Delivery Fee</span>
            <span>{shippingFee === 0 ? "Free" : formatINR(shippingFee)}</span>
          </div>
          <div className="border-t border-slate-200 pt-2 font-semibold text-slate-900">
            <div className="flex items-center justify-between">
              <span>Total Payable</span>
              <span>{formatINR(payable)}</span>
            </div>
          </div>
          <p className="rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
            Estimated delivery by {deliveryDays} days after order confirmation.
          </p>
        </div>
        <button className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
          Buy Now
        </button>
      </aside>
    </form>
  );
}
