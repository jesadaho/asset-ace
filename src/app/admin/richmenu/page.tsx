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
    setRegisterLoading(true);
    try {
      const createRes = await fetch("/api/richmenu", { method: "POST" });
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
          List existing rich menus and register the Owner Rich Menu (6-button, 2500×1686).
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
              Creates the 6-button Owner menu (2500×1686) and optionally uploads an image.
              Set the returned ID in .env as LINE_RICH_MENU_ID_OWNER.
            </p>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">
                Optional image (JPEG or PNG, 2500×1686, max 1 MB)
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
