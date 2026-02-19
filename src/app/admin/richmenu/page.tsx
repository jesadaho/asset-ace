"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";

type RichMenuEntry = {
  richMenuId: string;
  name?: string;
  chatBarText?: string;
};

export default function AdminRichMenuPage() {
  const [listData, setListData] = useState<{ richmenus?: RichMenuEntry[] } | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [menuSize, setMenuSize] = useState<"2500x1686" | "1200x810">("2500x1686");
  const [useCustomJson, setUseCustomJson] = useState(false);
  const [customJson, setCustomJson] = useState("");
  const [customJsonError, setCustomJsonError] = useState<string | null>(null);

  const loadList = async () => {
    setListError(null);
    setListLoading(true);
    try {
      const res = await fetch("/api/richmenu/list");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setListError(data.error || data.message || `Error ${res.status}`);
        setListData(null);
        return;
      }
      setListData(data);
    } catch (e) {
      setListError(e instanceof Error ? e.message : String(e));
      setListData(null);
    } finally {
      setListLoading(false);
    }
  };

  const registerOwner = async () => {
    setRegisterError(null);
    setCreatedId(null);
    setCustomJsonError(null);
    setRegisterLoading(true);
    try {
      let requestBody: { size?: string; customPayload?: unknown };
      if (useCustomJson && customJson.trim()) {
        try {
          const parsed = JSON.parse(customJson.trim()) as unknown;
          if (!parsed || typeof parsed !== "object" || !("size" in parsed) || !("areas" in parsed)) {
            setCustomJsonError("JSON must include size and areas (LINE Rich Menu format).");
            setRegisterLoading(false);
            return;
          }
          requestBody = { customPayload: parsed };
        } catch {
          setCustomJsonError("Invalid JSON. Paste a valid LINE Rich Menu JSON.");
          setRegisterLoading(false);
          return;
        }
      } else if (useCustomJson) {
        setCustomJsonError("Paste your Rich Menu JSON above.");
        setRegisterLoading(false);
        return;
      } else {
        requestBody = { size: menuSize };
      }

      const createRes = await fetch("/api/richmenu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        setRegisterError(createData.error || createData.message || `Error ${createRes.status}`);
        return;
      }
      const richMenuId = createData.richMenuId;
      if (!richMenuId) {
        setRegisterError("No richMenuId returned");
        return;
      }

      if (imageFile) {
        const form = new FormData();
        form.append("file", imageFile);
        const contentRes = await fetch(
          `/api/richmenu/${encodeURIComponent(richMenuId)}/content`,
          {
            method: "POST",
            body: form,
          }
        );
        if (!contentRes.ok) {
          const contentData = await contentRes.json().catch(() => ({}));
          setRegisterError(
            contentData.error || contentData.message || `Upload failed ${contentRes.status}`
          );
          setCreatedId(richMenuId);
          return;
        }
      }

      setCreatedId(richMenuId);
    } catch (e) {
      setRegisterError(e instanceof Error ? e.message : String(e));
    } finally {
      setRegisterLoading(false);
    }
  };

  const copyEnvLine = () => {
    if (!createdId) return;
    const line = `LINE_RICH_MENU_ID_OWNER=${createdId}`;
    void navigator.clipboard.writeText(line);
  };

  return (
    <div className="min-h-dvh bg-[#0F172A] text-white safe-area-top safe-area-bottom">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#10B981] hover:underline mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <h1 className="text-2xl font-bold mb-2">Rich Menu Management</h1>
        <p className="text-white/70 text-sm mb-8">
          List existing rich menus and register the Owner Rich Menu (6-button, 2500×1686 or 1200×810).
        </p>

        {/* Section 1 – List */}
        <Card variant="outline" className="mb-6">
          <CardHeader>
            <CardTitle>Existing rich menus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="primary"
              onClick={loadList}
              disabled={listLoading}
              isLoading={listLoading}
            >
              Load rich menus
            </Button>
            {listError && (
              <p className="text-red-400 text-sm" role="alert">
                {listError}
              </p>
            )}
            {listData?.richmenus && (
              <div className="rounded-lg bg-[#0F172A]/50 p-3 text-sm font-mono space-y-2">
                {listData.richmenus.length === 0 ? (
                  <p className="text-white/70">No rich menus found.</p>
                ) : (
                  listData.richmenus.map((m) => (
                    <div key={m.richMenuId} className="border-b border-white/10 pb-2 last:border-0 last:pb-0">
                      <div className="font-semibold text-[#10B981]">{m.richMenuId}</div>
                      {m.name != null && <div>name: {m.name}</div>}
                      {m.chatBarText != null && <div>chatBarText: {m.chatBarText}</div>}
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2 – Register */}
        <Card variant="outline">
          <CardHeader>
            <CardTitle>Register Owner Rich Menu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-white/80 text-sm">
              Creates the 6-button Owner menu and optionally uploads an image.
              Set the returned ID in .env as LINE_RICH_MENU_ID_OWNER.
            </p>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Mode
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="registerMode"
                    checked={!useCustomJson}
                    onChange={() => setUseCustomJson(false)}
                    className="rounded border-white/30 text-[#10B981] focus:ring-[#10B981]"
                  />
                  <span className="text-sm">Preset (Owner menu)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="registerMode"
                    checked={useCustomJson}
                    onChange={() => setUseCustomJson(true)}
                    className="rounded border-white/30 text-[#10B981] focus:ring-[#10B981]"
                  />
                  <span className="text-sm">Custom JSON</span>
                </label>
              </div>
            </div>

            {!useCustomJson ? (
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Size
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="menuSize"
                      checked={menuSize === "2500x1686"}
                      onChange={() => setMenuSize("2500x1686")}
                      className="rounded border-white/30 text-[#10B981] focus:ring-[#10B981]"
                    />
                    <span className="text-sm">2500×1686</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="menuSize"
                      checked={menuSize === "1200x810"}
                      onChange={() => setMenuSize("1200x810")}
                      className="rounded border-white/30 text-[#10B981] focus:ring-[#10B981]"
                    />
                    <span className="text-sm">1200×810</span>
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                  Rich Menu JSON (LINE format: size, name, chatBarText, areas)
                </label>
                <textarea
                  value={customJson}
                  onChange={(e) => { setCustomJson(e.target.value); setCustomJsonError(null); }}
                  placeholder='{"size":{"width":1200,"height":810},"selected":true,"name":"My Menu","chatBarText":"Menu","areas":[...]}'
                  rows={10}
                  className="w-full rounded-lg border border-white/20 bg-[#0F172A]/50 px-3 py-2 text-sm font-mono text-white placeholder:text-white/40 focus:border-[#10B981] focus:outline-none"
                />
                {customJsonError && (
                  <p className="mt-1 text-red-400 text-sm" role="alert">{customJsonError}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">
                Optional image (JPEG or PNG, match menu size, max 1 MB)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="block w-full text-sm text-white/80 file:mr-4 file:rounded-lg file:border-0 file:bg-[#10B981] file:px-4 file:py-2 file:text-white"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <Button
              variant="primary"
              onClick={registerOwner}
              disabled={registerLoading}
              isLoading={registerLoading}
            >
              Register Owner Rich Menu
            </Button>

            {registerError && (
              <p className="text-red-400 text-sm" role="alert">
                {registerError}
              </p>
            )}

            {createdId && (
              <div className="rounded-lg bg-[#0F172A]/50 p-4 space-y-2">
                <p className="text-sm font-medium text-[#10B981]">Success</p>
                <p className="text-sm text-white/80">
                  Set in .env:
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="flex-1 min-w-0 break-all rounded bg-black/30 px-2 py-2 text-sm">
                    LINE_RICH_MENU_ID_OWNER={createdId}
                  </code>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={copyEnvLine}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
