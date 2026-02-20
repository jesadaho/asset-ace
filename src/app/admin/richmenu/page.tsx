"use client";

import { useState, useEffect } from "react";
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
  const [createdWithoutImage, setCreatedWithoutImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [menuSize, setMenuSize] = useState<"2500x1686" | "1200x810">("2500x1686");
  const [useCustomJson, setUseCustomJson] = useState(false);
  const [customJson, setCustomJson] = useState("");
  const [customJsonError, setCustomJsonError] = useState<string | null>(null);

  const [removeMenuId, setRemoveMenuId] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removeSuccess, setRemoveSuccess] = useState(false);

  const [switchUserId, setSwitchUserId] = useState("");
  /** When list is loaded, this is a richMenuId from the list; used for Target dropdown */
  const [switchRichMenuId, setSwitchRichMenuId] = useState("");
  const [switchLoading, setSwitchLoading] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [switchResult, setSwitchResult] = useState<{
    linked: boolean;
    status?: number;
    message?: string;
  } | null>(null);

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
      // #region agent log
      const rms = (data as { richmenus?: { richMenuId?: string; name?: string }[] }).richmenus ?? [];
      fetch('http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d6e810'},body:JSON.stringify({sessionId:'d6e810',hypothesisId:'H3',location:'admin/richmenu/page.tsx loadList',message:'After setListData',data:{richmenusLength:rms.length,firstTwo:rms.slice(0,2).map(m=>({id:m.richMenuId,name:m.name})),dataKeys:Object.keys(data as object)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
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
    setCreatedWithoutImage(false);
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
        setCreatedWithoutImage(false);
      } else {
        setCreatedWithoutImage(true);
        setRemoveMenuId(richMenuId);
        document.getElementById("remove-menu-card")?.scrollIntoView({ behavior: "smooth" });
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

  const removeMenu = async () => {
    if (!removeMenuId) return;
    setRemoveError(null);
    setRemoveSuccess(false);
    setRemoveLoading(true);
    try {
      const res = await fetch(
        `/api/richmenu/${encodeURIComponent(removeMenuId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setRemoveError(data.error || data.message || `Error ${res.status}`);
        return;
      }
      setRemoveSuccess(true);
      setRemoveMenuId(null);
      await loadList();
    } catch (e) {
      setRemoveError(e instanceof Error ? e.message : String(e));
    } finally {
      setRemoveLoading(false);
    }
  };

  const doSwitchRichMenu = async () => {
    setSwitchError(null);
    setSwitchResult(null);
    const uid = switchUserId.trim();
    if (!uid) {
      setSwitchError("Enter a LINE user ID.");
      return;
    }
    if (!switchRichMenuId) {
      setSwitchError("Load rich menus first and select a target menu.");
      return;
    }
    setSwitchLoading(true);
    try {
      const res = await fetch("/api/debug/switch-richmenu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, richMenuId: switchRichMenuId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSwitchError(data.error || data.message || `Error ${res.status}`);
        return;
      }
      setSwitchResult({
        linked: !!data.linked,
        status: data.status,
        message: data.message,
      });
    } catch (e) {
      setSwitchError(e instanceof Error ? e.message : String(e));
    } finally {
      setSwitchLoading(false);
    }
  };

  const menus = listData?.richmenus ?? [];
  const canRemove = menus.length > 0 && removeMenuId;

  // When rich menus list is loaded, pre-select first if none or current not in list
  useEffect(() => {
    if (menus.length === 0) return;
    const currentInList = switchRichMenuId && menus.some((m) => m.richMenuId === switchRichMenuId);
    if (!currentInList) {
      setSwitchRichMenuId(menus[0].richMenuId);
    }
  }, [menus, switchRichMenuId]);

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-6">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Rich Menu Management</h1>
        <p className="text-slate-600 mt-1 text-sm">
          List existing rich menus and register the Owner Rich Menu (6-button, 2500×1686 or 1200×810).
        </p>
      </header>

      {/* Section 1 – List */}
      <Card variant="light" className="border-slate-200 mb-6">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">Existing rich menus</CardTitle>
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
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {listError}
            </p>
          )}
          {listData?.richmenus && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-mono space-y-2">
              {listData.richmenus.length === 0 ? (
                <p className="text-slate-600">No rich menus found.</p>
              ) : (
                listData.richmenus.map((m) => (
                  <div key={m.richMenuId} className="border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                    <div className="font-semibold text-emerald-700">{m.richMenuId}</div>
                    {m.name != null && <div className="text-slate-700">name: {m.name}</div>}
                    {m.chatBarText != null && <div className="text-slate-700">chatBarText: {m.chatBarText}</div>}
                    <button
                      type="button"
                      onClick={() => {
                        setRemoveMenuId(m.richMenuId);
                        setRemoveError(null);
                        setRemoveSuccess(false);
                        document.getElementById("remove-menu-card")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="mt-1 text-xs text-emerald-600 hover:underline font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2 – Remove */}
      <Card id="remove-menu-card" variant="light" className="border-slate-200 mb-6">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">Remove rich menu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!listData ? (
            <p className="text-slate-600 text-sm">Load rich menus first.</p>
          ) : menus.length === 0 ? (
            <p className="text-slate-600 text-sm">No rich menus. Register one below first.</p>
          ) : (
            <>
              <div>
                <label className={labelClass}>Select rich menu to remove</label>
                <select
                  value={removeMenuId ?? ""}
                  onChange={(e) => {
                    setRemoveMenuId(e.target.value || null);
                    setRemoveError(null);
                    setRemoveSuccess(false);
                  }}
                  className={inputClass}
                >
                  <option value="">Choose a menu</option>
                  {menus.map((m) => (
                    <option key={m.richMenuId} value={m.richMenuId}>
                      {m.name ?? m.richMenuId}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="primary"
                onClick={removeMenu}
                disabled={!canRemove || removeLoading}
                isLoading={removeLoading}
              >
                Remove
              </Button>
              {removeError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{removeError}</p>
              )}
              {removeSuccess && (
                <p className="text-emerald-700 text-sm font-medium">Rich menu removed.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Switch rich menu */}
      <Card variant="light" className="border-slate-200 mb-6">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">Switch rich menu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600 text-sm">
            Link a user to a rich menu. Load rich menus above to see the list (debug).
          </p>
          <div>
            <label className={labelClass}>LINE user ID</label>
            <input
              type="text"
              value={switchUserId}
              onChange={(e) => setSwitchUserId(e.target.value)}
              placeholder="U..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Target</label>
              {/* #region agent log */}
              {(() => {
                fetch('http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d6e810'},body:JSON.stringify({sessionId:'d6e810',hypothesisId:'H1_H4',location:'admin/richmenu/page.tsx Switch Target',message:'Switch dropdown render',data:{menusLength:menus.length,listDataHasRichmenus:!!listData?.richmenus,listRichmenusLength:listData?.richmenus?.length ?? 0,optionsPreview:menus.slice(0,5).map(m=>({id:m.richMenuId,label:m.name||m.chatBarText||m.richMenuId}))},timestamp:Date.now()})}).catch(()=>{});
                return null;
              })()}
              {/* #endregion */}
              {menus.length === 0 ? (
                <p className="text-slate-500 text-sm py-2">
                  Load rich menus first to select a target.
                </p>
              ) : (
                <select
                  value={switchRichMenuId}
                  onChange={(e) => setSwitchRichMenuId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select a rich menu…</option>
                  {menus.map((m) => (
                    <option key={m.richMenuId} value={m.richMenuId}>
                      {m.name || m.chatBarText || m.richMenuId}
                    </option>
                  ))}
                </select>
              )}
          </div>
          <Button
            variant="primary"
            onClick={doSwitchRichMenu}
            disabled={switchLoading || menus.length === 0 || !switchRichMenuId}
            isLoading={switchLoading}
          >
            Switch
          </Button>
          {switchError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {switchError}
            </p>
          )}
          {switchResult && (
            <div
              className={`rounded-xl border p-3 text-sm ${
                switchResult.linked
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {switchResult.linked ? "Linked." : "Failed."}
              {switchResult.status != null && (
                <span className="ml-2">Status: {switchResult.status}</span>
              )}
              {switchResult.message && (
                <div className="mt-1 font-mono text-xs break-all">
                  {switchResult.message}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3 – Register */}
      <Card variant="light" className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">Register Owner Rich Menu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600 text-sm">
            Creates the 6-button Owner menu and optionally uploads an image.
            Set the returned ID in .env as LINE_RICH_MENU_ID_OWNER.
          </p>

          <div>
            <label className={labelClass}>Mode</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="registerMode"
                  checked={!useCustomJson}
                  onChange={() => setUseCustomJson(false)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Preset (Owner menu)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="registerMode"
                  checked={useCustomJson}
                  onChange={() => setUseCustomJson(true)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Custom JSON</span>
              </label>
            </div>
          </div>

          {!useCustomJson ? (
            <div>
              <label className={labelClass}>Size</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="menuSize"
                    checked={menuSize === "2500x1686"}
                    onChange={() => setMenuSize("2500x1686")}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">2500×1686</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="menuSize"
                    checked={menuSize === "1200x810"}
                    onChange={() => setMenuSize("1200x810")}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">1200×810</span>
                </label>
              </div>
            </div>
          ) : (
            <div>
              <label className={labelClass}>
                Rich Menu JSON (LINE format: size, name, chatBarText, areas)
              </label>
              <textarea
                value={customJson}
                onChange={(e) => { setCustomJson(e.target.value); setCustomJsonError(null); }}
                placeholder='{"size":{"width":1200,"height":810},"selected":true,"name":"My Menu","chatBarText":"Menu","areas":[...]}'
                rows={10}
                className={`${inputClass} font-mono`}
              />
              {customJsonError && (
                <p className="mt-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{customJsonError}</p>
              )}
            </div>
          )}

          <div>
            <label className={labelClass}>
              Optional image (JPEG or PNG, match menu size, max 1 MB)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-white file:font-medium"
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
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {registerError}
            </p>
          )}

          {createdId && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              {createdWithoutImage && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 mb-2">
                  <p className="text-amber-800 text-sm font-medium">Image required</p>
                  <p className="text-amber-700 text-xs mt-1">
                    LINE will not link this menu to users until it has an image. Remove it in &quot;Remove rich menu&quot; above, then register again and attach an image.
                  </p>
                </div>
              )}
              <p className="text-sm font-medium text-emerald-700">Success</p>
              <p className="text-sm text-slate-600">Set in .env:</p>
              <div className="flex items-center gap-2 flex-wrap">
                <code className="flex-1 min-w-0 break-all rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800">
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
  );
}
