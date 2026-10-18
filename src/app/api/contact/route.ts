import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FORMSUBMIT_EMAIL =
  process.env.CONTACT_EMAIL || "mahaganapathirevu@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message, _honey } = body;

    // Honeypot check: silently drop bots
    if (_honey && String(_honey).trim().length > 0) {
      return NextResponse.json({ success: true });
    }

    // Validation
    const cleanName = String(name || "").trim().slice(0, 120);
    const cleanEmail = String(email || "").trim().slice(0, 254);
    const cleanTopic = String(subject || "General Feedback").trim().slice(0, 100);
    const cleanMessage = String(message || "").trim().slice(0, 5000);

    if (!cleanName || !cleanEmail || !cleanMessage) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (cleanMessage.length < 10) {
      return NextResponse.json(
        { error: "Your message must be at least 10 characters." },
        { status: 400 }
      );
    }

    // Forward to FormSubmit with origin set to pre-activated domain
    const formSubmitUrl = `https://formsubmit.co/ajax/${FORMSUBMIT_EMAIL}`;
    const res = await fetch(formSubmitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: "http://localhost:3000",
        Referer: "http://localhost:3000/contact",
      },
      body: JSON.stringify({
        Name: cleanName,
        Email: cleanEmail,
        Topic: cleanTopic,
        Message: cleanMessage,
        _subject: `[ToolKit Contact] [${cleanTopic}] from ${cleanName}`,
        _replyto: cleanEmail,
        _template: "table",
        _captcha: "false",
      }),
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data?.success === "true") {
      return NextResponse.json({ success: true });
    }

    if (data?.message && data?.message.toLowerCase().includes("success")) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: data?.message || "Failed to send message. Please try again." },
      { status: 500 }
    );
  } catch (err: unknown) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
