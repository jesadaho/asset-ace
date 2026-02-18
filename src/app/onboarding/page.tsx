"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLiff } from "@/providers/LiffProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  submitOnboarding,
  checkOnboardingStatus,
  getRoleDashboardPath,
  type OnboardingData,
} from "@/lib/api/onboarding";
import { User } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "owner", label: "Asset Owner" },
  { value: "agent", label: "Agent" },
  { value: "tenant", label: "Tenant" },
];

const PHONE_REGEX = /^[\d\s\-+()]{8,20}$/;

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && PHONE_REGEX.test(phone);
}

export default function OnboardingPage() {
  const router = useRouter();
  const { isReady, profile } = useLiff();
  const [role, setRole] = useState<OnboardingData["role"] | "">("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ role?: string; name?: string; phone?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.displayName && !name) {
      setName(profile.displayName);
    }
  }, [profile?.displayName, name]);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!role) next.role = "Please select a role";
    if (!name.trim()) next.name = "Name is required";
    if (!phone.trim()) next.phone = "Phone number is required";
    else if (!isValidPhone(phone)) next.phone = "Enter a valid phone number";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await submitOnboarding({ role: role as OnboardingData["role"], name: name.trim(), phone: phone.trim() });
      router.push(getRoleDashboardPath(role));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#0F172A] text-white safe-area-top">
      <div className="max-w-lg mx-auto px-4 py-12">
        <header className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10B981]/20 text-[#10B981] mb-4">
            <User className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Welcome to Asset Ace
          </h1>
          <p className="text-white/70 text-base">
            Complete your profile to get started
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-white/90 mb-2">
              I am a
            </label>
            <Select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as OnboardingData["role"])}
              options={ROLE_OPTIONS}
              placeholder="Select your role"
              error={Boolean(errors.role)}
            />
            {errors.role && (
              <p className="mt-1.5 text-sm text-red-400">{errors.role}</p>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white/90 mb-2">
              Full name
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              error={Boolean(errors.name)}
              autoComplete="name"
            />
            {errors.name && (
              <p className="mt-1.5 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-white/90 mb-2">
              Phone number
            </label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +66 123 456 789"
              error={Boolean(errors.phone)}
              autoComplete="tel"
            />
            {errors.phone && (
              <p className="mt-1.5 text-sm text-red-400">{errors.phone}</p>
            )}
          </div>

          {submitError && (
            <p className="text-sm text-red-400">{submitError}</p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
            disabled={!isReady}
          >
            Complete setup
          </Button>
        </form>
      </div>
    </div>
  );
}
