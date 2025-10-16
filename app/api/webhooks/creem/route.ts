import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.type) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  switch (String(body.type)) {
    case "checkout.completed":
    case "subscription.updated":
    case "subscription.cancelled":
    case "payment.succeeded":
    case "payment.failed":
    default:
      break;
  }

  return NextResponse.json({ received: true });
}