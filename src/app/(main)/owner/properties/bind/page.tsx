"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Check, Plus } from "lucide-react";

type Role = "owner" | "agent" | "tenant";

type PropertyListItem = {
  id: string;
  name: string;
  address: string;
  status: string;
  imageUrl?: string;
};

const cardBase =
  "w-full rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-slate-300 transition-colors";

export default function BindPropertyPage() {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");

  const [accessGate, setAccessGate] = useState<"checking" | "allowed">(
    "checking"
  );
  const [role, setRole] = useState<Role | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);

  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [binding, setBinding] = useState(false);
  const [bindSuccess, setBindSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function checkRoleAndContext() {
      try {
        const liff = (await import("@line/liff")).default;
        await liff.ready;

        if (!liff.isLoggedIn()) {
          if (!cancelled) {
            setAccessGate("allowed");
            setContextError(tAuth("pleaseLogin"));
          }
          return;
        }

        const token = liff.getAccessToken();
        if (!token) {
          if (!cancelled) {
            setAccessGate("allowed");
            setContextError(tAuth("pleaseLogin"));
          }
          return;
        }

        const res = await fetch("/api/onboarding", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json()) as { onboarded?: boolean; role?: Role };
        if (cancelled) return;

        if (!data.onboarded) {
          router.replace("/onboarding");
          return;
        }

        if (!data.role) {
          router.replace("/onboarding");
          return;
        }

        setRole(data.role);
        if (data.role === "tenant") {
          router.replace("/tenants");
          return;
        }

        const ctx = liff.getContext();
        const gid =
          ctx?.type === "group"
            ? (ctx as { groupId?: string }).groupId
            : ctx?.type === "room"
              ? (ctx as { roomId?: string }).roomId
              : undefined;

        // Spec requires group context only.
        if (ctx?.type !== "group" || !gid) {
          setContextError("ต้องเปิดหน้านี้จากในกลุ่มแชท (LINE Group) เท่านั้น");
          setGroupId(null);
          setAccessGate("allowed");
          return;
        }

        setGroupId(gid);
        setContextError(null);
        setAccessGate("allowed");
      } catch {
        if (!cancelled) {
          setAccessGate("allowed");
          setContextError("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่");
        }
      }
    }

    checkRoleAndContext();
    return () => {
      cancelled = true;
    };
  }, [router, tAuth]);

  useEffect(() => {
    if (accessGate !== "allowed") return;
    if (!role || role === "tenant") return;
    if (!groupId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function fetchProperties() {
      setLoading(true);
      setError(null);
      try {
        const liff = (await import("@line/liff")).default;
        const token = liff.getAccessToken();
        if (!token) {
          if (!cancelled) setError(tAuth("pleaseLogin"));
          return;
        }

        const endpoint =
          role === "agent" ? "/api/agent/properties" : "/api/owner/properties";
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { message?: string };
          setError(data.message ?? "โหลดรายการทรัพย์ไม่สำเร็จ");
          return;
        }
        const data = (await res.json()) as {
          properties?: Array<{
            id: string;
            name: string;
            address: string;
            status?: string;
            imageUrl?: string;
          }>;
        };
        const list = (data.properties ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          address: p.address,
          status: p.status ?? "",
          imageUrl: p.imageUrl,
        }));
        // Spec: show only "occupied" (สถานะเช่าอยู่) so user binds correct assets.
        const occupiedOnly = list.filter((p) => p.status === "Occupied");
        setProperties(occupiedOnly);
        if (occupiedOnly.length === 1) setSelectedId(occupiedOnly[0].id);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "โหลดรายการทรัพย์ไม่สำเร็จ");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProperties();
    return () => {
      cancelled = true;
    };
  }, [accessGate, groupId, role, tAuth]);

  const canBind = useMemo(() => {
    return !!groupId && !!selectedId && !binding;
  }, [binding, groupId, selectedId]);

  const handleAddProperty = () => {
    // Fix: when user presses browser back from Add page, they should land on My Property page.
    // We replace current history entry (bind) with /owner/properties, then push add page.
    router.replace("/owner/properties");
    setTimeout(() => {
      router.push("/owner/properties/add");
    }, 0);
  };

  const handleBind = async () => {
    if (!canBind || !groupId) return;
    setBinding(true);
    setBindSuccess(false);
    setError(null);
    try {
      const liff = (await import("@line/liff")).default;
      const token = liff.getAccessToken();
      if (!token) {
        setError(tAuth("pleaseLogin"));
        setBinding(false);
        return;
      }
      const codeRes = await fetch("/api/line/bind-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ propertyId: selectedId }),
      });
      const codeData = (await codeRes.json().catch(() => ({}))) as {
        code?: string;
        message?: string;
      };
      if (!codeRes.ok || !codeData.code) {
        setError(codeData.message ?? `สร้างโค้ดไม่สำเร็จ (${codeRes.status})`);
        setBinding(false);
        return;
      }

      const command = `/bind ${codeData.code}`;

      // Send a friendly short code into the group; webhook resolves code → propertyId and binds via source.groupId.
      await liff.sendMessages([{ type: "text", text: command }]);

      setBindSuccess(true);
      setBinding(false);
      try {
        // Close immediately after successful bind (LINE LIFF UX).
        liff.closeWindow();
      } catch {
        // ignore closeWindow errors
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Bind failed";
      setError(
        `${msg}\n\nถ้าส่งข้อความไม่สำเร็จ ให้เปิดใหม่แล้วลองอีกครั้ง`
      );
      setBinding(false);
    }
  };

  if (accessGate === "checking") {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center px-4">
        <p className="text-slate-500 text-sm">{tCommon("loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white safe-area-top">
        <div className="flex max-w-lg mx-auto items-center gap-2 px-4 py-3">
          <Link
            href="/owner/properties"
            className="shrink-0 flex items-center justify-center p-2 -m-2 text-[#0F172A] hover:text-[#003366] tap-target min-h-[44px] min-w-[44px]"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 className="min-w-0 flex-1 text-lg font-semibold text-[#0F172A] text-center truncate">
            ผูกกลุ่มกับสินทรัพย์
          </h1>
          <span className="w-9" aria-hidden />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-28 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <p className="text-sm text-slate-700">
            เลือกสินทรัพย์ที่ต้องการผูกกับกลุ่มนี้
          </p>
          {groupId && (
            <p className="text-xs break-all text-slate-500">
              groupId (จาก LIFF): {groupId}
            </p>
          )}
          {contextError && (
            <p className="text-sm text-red-600" role="alert">
              {contextError}
            </p>
          )}
          {bindSuccess && (
            <p className="text-sm text-emerald-700" role="status">
              ผูกกลุ่มสำเร็จแล้ว
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#0F172A] hover:bg-slate-50 tap-target min-h-[44px]"
            type="button"
            onClick={handleAddProperty}
          >
            <Plus className="h-4 w-4" aria-hidden />
            เพิ่มสินทรัพย์
          </button>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 tap-target min-h-[44px]"
          >
            รีเฟรช
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{tCommon("loading")}</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <p className="text-sm text-slate-700">
              ยังไม่มีสินทรัพย์สถานะเช่าอยู่ให้เลือก
            </p>
            <p className="text-xs text-slate-500">
              กด “เพิ่มสินทรัพย์” เพื่อสร้างรายการใหม่ แล้วกลับมาเลือกเพื่อผูกกลุ่ม
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((p) => {
              const selected = selectedId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`${cardBase} ${selected ? "border-[#003366]" : ""}`}
                  onClick={() => setSelectedId(p.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#0F172A] truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {p.address}
                      </p>
                      {p.status ? (
                        <p className="text-xs text-slate-500 mt-1">
                          สถานะ: {p.status}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 pt-1">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                          selected
                            ? "border-[#003366] bg-[#003366] text-white"
                            : "border-slate-300 text-transparent"
                        }`}
                        aria-hidden
                      >
                        <Check className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-30 max-w-lg mx-auto safe-area-bottom bg-white border-t border-slate-100 p-4">
        <button
          type="button"
          onClick={handleBind}
          disabled={!canBind}
          className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold tap-target min-h-[44px] ${
            canBind
              ? "bg-[#003366] text-white hover:opacity-95"
              : "bg-slate-200 text-slate-500 cursor-not-allowed"
          }`}
        >
          {binding ? "กำลังผูกกลุ่ม..." : "ผูกกลุ่ม"}
        </button>
        {!groupId && (
          <p className="mt-2 text-xs text-slate-500 text-center">
            ต้องเปิดหน้านี้จากในกลุ่มแชทเพื่ออ่าน groupId
          </p>
        )}
      </div>
    </div>
  );
}

