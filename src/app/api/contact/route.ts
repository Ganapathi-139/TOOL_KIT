import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const { name, email, subject, message, _honey } = body;

    // Honeypot check: silently accept bot submissions to waste spammer resources
    if (_honey && String(_honey).trim().length > 0) {
      return NextResponse.json({ success: true });
    }

    // Validation
    const safeName = String(name || "").trim().slice(0, 120);
    const safeEmail = String(email || "").trim().slice(0, 254);
    const safeSubject = String(subject || "Feedback").trim().slice(0, 100);
    const safeMessage = String(message || "").trim().slice(0, 5000);

    if (!safeEmail.includes("@") || !safeEmail.includes(".")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (safeMessage.length < 10) {
      return NextResponse.json({ error: "Your message must be at least 10 characters." }, { status: 400 });
    }

    // Server-to-server forward (bypasses all browser ad-blockers, shields, and CORS restrictions)
    const targetEmail = process.env.CONTACT_EMAIL || "contact@sgscreations.in";
    const endpoint =
      process.env.FORMSUBMIT_ENDPOINT ||
      `https://formsubmit.co/ajax/${targetEmail}`;

    const formSubmitRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        Name: safeName,
        Email: safeEmail,
        Topic: safeSubject,
        Message: safeMessage,
        _subject: `[ToolKit Contact] [${safeSubject}] from ${safeName}`,
        _replyto: safeEmail,
        _template: "table",
        _captcha: "false",
      }),
    });

    const data = await formSubmitRes.json().catch(() => null);

    const isSuccess =
      (formSubmitRes.ok && data?.success === "true") ||
      (data?.message && data.message.toLowerCase().includes("activation")) ||
      (data?.message && data.message.toLowerCase().includes("success"));

    if (isSuccess) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      {
        error:
          data?.message ||
          "Could not deliver message through the contact gateway. Please use direct email.",
      },
      { status: 502 }
    );
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Internal contact service error.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
