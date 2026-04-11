import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia" as any,
});

export async function POST(req: NextRequest) {
  try {
    const { items, email, address } = await req.json();

    const lineItems = items.map((item: any) => {
      const imageUrl = item.product.image?.startsWith("http")
        ? item.product.image
        : `${req.nextUrl.origin}${item.product.image}`;

      return {
        price_data: {
          currency: "inr",
          product_data: {
            name: item.product.name.slice(0, 100),
            description: item.product.brand.slice(0, 500),
          },
          unit_amount: Math.round(item.product.price * 100),
        },
        quantity: item.quantity,
      };
    });

    // Add shipping fee if applicable (matching CheckoutPage logic)
    const cartTotal = items.reduce(
      (acc: number, item: any) => acc + item.product.price * item.quantity,
      0
    );
    const shippingFee = cartTotal > 24999 ? 0 : 99;

    if (shippingFee > 0) {
      lineItems.push({
        price_data: {
          currency: "inr",
          product_data: {
            name: "Shipping Fee",
            description: "Standard delivery charges",
          },
          unit_amount: shippingFee * 100,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.nextUrl.origin}/checkout?success=true`,
      cancel_url: `${req.nextUrl.origin}/checkout?canceled=true`,
      customer_email: email || undefined,
      metadata: {
        address: JSON.stringify(address).slice(0, 500),
      },
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err: any) {
    console.error("Full Stripe Error:", JSON.stringify(err, null, 2));
    return NextResponse.json(
      { error: err.message || "Internal Server Error", detail: err.type },
      { status: 500 }
    );
  }
}
