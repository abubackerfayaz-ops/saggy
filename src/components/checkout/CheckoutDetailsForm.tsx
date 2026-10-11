"use client";

import { useState, type ReactNode } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  EMPTY_DETAILS,
  loadDetails,
  saveDetails,
  validateDetails,
  type CheckoutDetailErrors,
  type CheckoutDetails,
} from "@/lib/checkout";

interface CheckoutDetailsFormProps {
  onSubmit: (details: CheckoutDetails) => void;
  submitting?: boolean;
  error?: string | null;
  submitLabel?: string;
  footer?: ReactNode;
}

const fieldClass =
  "w-full h-11 bg-[#0d0c10] border border-white/10 rounded-xl px-3.5 text-sm text-white placeholder:text-neutral-600 font-body outline-none focus:border-[#FF2D88]/60 transition-colors";

export default function CheckoutDetailsForm({
  onSubmit,
  submitting = false,
  error,
  submitLabel = "Continue to Payment",
  footer,
}: CheckoutDetailsFormProps) {
  // Both checkout flows render this form client-side only (behind a hydration
  // gate), so localStorage is readable during the initial mount.
  const [details, setDetails] = useState<CheckoutDetails>(
    () => loadDetails() ?? EMPTY_DETAILS
  );
  const [errors, setErrors] = useState<CheckoutDetailErrors>({});

  const set = (key: keyof CheckoutDetails, value: string) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateDetails(details);
    if (Object.values(found).some(Boolean)) {
      setErrors(found);
      return;
    }
    const clean: CheckoutDetails = {
      name: details.name.trim(),
      phone: details.phone.replace(/\D/g, ""),
      email: details.email.trim(),
      line1: details.line1.trim(),
      line2: details.line2.trim(),
      city: details.city.trim(),
      state: details.state.trim(),
      pinCode: details.pinCode.replace(/\D/g, ""),
    };
    saveDetails(clean);
    onSubmit(clean);
  };

  const field = (
    key: keyof CheckoutDetails,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
    span = false
  ) => (
    <label className={`block ${span ? "sm:col-span-2" : ""}`}>
      <span className="block text-[10px] font-label uppercase tracking-widest text-neutral-400 mb-1.5">
        {label}
      </span>
      <input
        {...props}
        value={details[key]}
        onChange={(e) => set(key, e.target.value)}
        className={`${fieldClass} ${errors[key] ? "border-rose-500/70" : ""}`}
        disabled={submitting}
      />
      {errors[key] && (
        <span className="block text-[11px] text-rose-400 mt-1 font-body">{errors[key]}</span>
      )}
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field("name", "Full Name", { placeholder: "Your name", autoComplete: "name" }, true)}
        {field("phone", "Mobile Number", {
          placeholder: "10-digit mobile",
          inputMode: "numeric",
          maxLength: 10,
          autoComplete: "tel",
        })}
        {field("email", "Email (optional)", {
          placeholder: "you@example.com",
          inputMode: "email",
          autoComplete: "email",
        })}
        {field("line1", "Address Line 1", { placeholder: "House no, street", autoComplete: "address-line1" }, true)}
        {field("line2", "Address Line 2 (optional)", {
          placeholder: "Landmark, area",
          autoComplete: "address-line2",
        }, true)}
        {field("city", "City", { placeholder: "City", autoComplete: "address-level2" })}
        {field("state", "State", { placeholder: "State", autoComplete: "address-level1" })}
        {field("pinCode", "PIN Code", {
          placeholder: "6-digit PIN",
          inputMode: "numeric",
          maxLength: 6,
          autoComplete: "postal-code",
        })}
      </div>

      {error && (
        <p className="text-xs text-rose-400 font-body bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-13 flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF2D88] to-[#FF5DAA] hover:brightness-110 text-white font-cta font-bold text-sm tracking-widest uppercase rounded-2xl transition-all active:scale-95 disabled:opacity-60 shadow-[0_0_20px_rgba(255,45,136,0.35)]"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <span>{submitLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {footer}
    </form>
  );
}
