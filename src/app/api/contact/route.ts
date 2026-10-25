import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const { name, email, subject, message, _honey } = body;

    // Honeypot check: silently accept bot submissions
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

    // Target email (defaults to sgs.creations03@gmail.com, configurable via CONTACT_EMAIL env)
    const targetEmail = process.env.CONTACT_EMAIL || "sgs.creations03@gmail.com";
    const endpoint =
      process.env.FORMSUBMIT_ENDPOINT ||
      `https://formsubmit.co/ajax/${targetEmail}`;

    const formSubmitRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Referer: "https://toolkit.sgscreations.in/",
        Origin: "https://toolkit.sgscreations.in",
        "User-Agent": "Mozilla/5.0 (compatible; ToolKit/1.0; +https://toolkit.sgscreations.in)",
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

    // Check success: accept 200, success flag, or activation message
    const isSuccess =
      formSubmitRes.ok ||
      data?.success === "true" ||
      data?.success === true ||
      (typeof data?.message === "string" &&
        (data.message.toLowerCase().includes("activation") ||
          data.message.toLowerCase().includes("success")));

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
