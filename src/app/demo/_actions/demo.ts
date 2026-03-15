"use server";

import { createClient } from "@/lib/supabase/server";

export async function requestDemoOtp(email: string) {
  try {
    if (!email || !email.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("request_demo_otp", {
      p_email: email,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error ?? "Failed to send code." };
    }

    // Email is sent via pending_emails queue (process-email-queue picks it up)
    return { success: true };
  } catch (err) {
    console.error("requestDemoOtp error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function verifyDemoOtp(email: string, code: string) {
  try {
    if (!email || !code || code.length !== 6) {
      return { success: false, error: "Please enter the 6-digit code." };
    }

    // Use a SINGLE client for both RPC and sign-in so cookies propagate correctly
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("verify_demo_otp", {
      p_email: email,
      p_code: code,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error ?? "Invalid or expired code. Please try again." };
    }

    // Sign in as demo staff user using the SAME supabase client
    const demoEmail = process.env.DEMO_STAFF_EMAIL;
    const demoPassword = process.env.DEMO_STAFF_PASSWORD;

    if (!demoEmail || !demoPassword) {
      console.error("Missing DEMO_STAFF_EMAIL or DEMO_STAFF_PASSWORD env vars");
      return { success: false, error: "Demo not configured. Please contact support." };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });

    if (signInError) {
      console.error("Demo sign-in failed:", signInError.message, "email:", demoEmail);
      return { success: false, error: `Sign-in error: ${signInError.message}` };
    }

    return { success: true };
  } catch (err) {
    console.error("verifyDemoOtp error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function signOutDemoUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
