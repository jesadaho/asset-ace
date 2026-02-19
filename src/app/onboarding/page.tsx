"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLiff } from "@/providers/LiffProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  submitOnboarding,
  getRoleDashboardPath,
  type OnboardingData,
  type OnboardingSuccessResponse,
} from "@/lib/api/onboarding";
import { User, Building2, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

const ROLE_OPTIONS: { value: OnboardingData["role"]; label: string; icon: typeof Building2 }[] = [
  { value: "owner", label: "Asset Owner", icon: Building2 },
  { value: "agent", label: "Agent", icon: User },
  { value: "tenant", label: "Tenant", icon: Home },
];

const PHONE_REGEX = /^[\d\s\-+()]{8,20}$/;

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && PHONE_REGEX.test(phone);
}

export default function OnboardingPage() {
  const router = useRouter();
  const { isReady, isLoggedIn, profile, error, login } = useLiff();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<OnboardingData["role"] | "">("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [richMenuDebug, setRichMenuDebug] = useState<OnboardingSuccessResponse["debug"] | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const validateStep2 = (): boolean => {
    const next: { name?: string; phone?: string } = {};
    if (!name.trim()) next.name = "Name is required";
    if (!phone.trim()) next.phone = "Phone number is required";
    else if (!isValidPhone(phone)) next.phone = "Enter a valid phone number";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setRichMenuDebug(null);
    setJustSubmitted(false);
    if (!validateStep2()) return;

    setIsSubmitting(true);
    try {
      const result = await submitOnboarding({
        role: role as OnboardingData["role"],
        name: name.trim(),
        phone: phone.trim(),
      });
      if (result?.debug) {
        setRichMenuDebug(result.debug);
        setJustSubmitted(true);
      } else {
        router.push(getRoleDashboardPath(role));
      }
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
          <div className="flex flex-col items-center gap-3 mb-4">
            {profile?.pictureUrl ? (
              <img
                src={profile.pictureUrl}
                alt={profile.displayName || "Profile"}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-[#10B981]/30"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#10B981]/20 text-[#10B981]">
                <User className="h-8 w-8" aria-hidden />
              </div>
            )}
            {profile?.displayName && (
              <p className="text-white font-medium">{profile.displayName}</p>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Welcome to Asset Ace
          </h1>
          <p className="text-white/70 text-base">
            {step === 1 ? "Choose your role to continue" : "Complete your profile"}
          </p>
        </header>

        {isReady && isLoggedIn === false && (
          <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-900/30 p-4 text-center">
            <p className="text-amber-200 text-sm mb-3">
              Please log in with LINE to continue.
            </p>
            <Button type="button" onClick={login} size="lg" className="w-full">
              Log in with LINE
            </Button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-900/20 p-4 text-center">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {justSubmitted && richMenuDebug?.richMenu && (
          <div className="space-y-4 mb-6">
            <p className="text-[#10B981] font-medium">Setup complete</p>
            <div className="rounded border border-white/20 bg-white/5 p-3 text-left">
              <p className="text-xs font-medium text-white/80 mb-2">Rich Menu (debug)</p>
              <pre className="text-xs font-mono text-white/90 whitespace-pre-wrap break-all">
                {JSON.stringify(richMenuDebug.richMenu, null, 2)}
              </pre>
            </div>
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={() => {
                setJustSubmitted(false);
                router.push(getRoleDashboardPath(role));
              }}
            >
              Go to dashboard
            </Button>
          </div>
        )}

        {!justSubmitted && step === 1 ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-white/90 mb-2">I am a</p>
            {ROLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                  setRole(opt.value);
                  setStep(2);
                }}
                  className="w-full text-left"
                >
                  <Card
                    variant="outline"
                    className={`transition-colors cursor-pointer tap-target min-h-[60px] ${
                      selected ? "border-[#10B981] bg-[#10B981]/10" : "hover:border-[#10B981]/50"
                    }`}
                  >
                    <CardContent className="flex items-center gap-4 py-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                          selected ? "bg-[#10B981]/30 text-[#10B981]" : "bg-white/10 text-white/80"
                        }`}
                      >
                        <Icon className="h-6 w-6" aria-hidden />
                      </div>
                      <span className="text-lg font-medium text-white">{opt.label}</span>
                      {selected && (
                        <span className="ml-auto text-[#10B981] text-sm font-medium">
                          Selected
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        ) : !justSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-white/70 hover:text-white mb-2"
            >
              Change role
            </button>

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
              <p className="text-sm text-red-400" role="alert">{submitError}</p>
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
        ) : null}
      </div>
    </div>
  );
}
