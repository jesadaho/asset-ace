export interface RichMenuLinkResult {
  linked: boolean;
  status?: number;
  message?: string;
}

export type DebugRichMenuTarget = "onboarding" | "owner";

const DEBUG_RICH_MENU_IDS: Record<DebugRichMenuTarget, string> = {
  onboarding: "richmenu-824251cf7d41db2ec209b88539891c60",
  owner: "richmenu-d46f17ab4f79310c50f3f286ee82e010",
};

/**
 * Link a Rich Menu to a LINE user via the Messaging API.
 * Does not throw; logs failures and returns result with linked, status, message.
 */
export async function linkRichMenuToUser(
  userId: string,
  richMenuId: string
): Promise<RichMenuLinkResult> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token?.trim()) {
    console.error("[Rich Menu] LINE_CHANNEL_ACCESS_TOKEN is not set");
    // #region agent log
    fetch('http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d6e810'},body:JSON.stringify({sessionId:'d6e810',hypothesisId:'richMenu',location:'richmenu.ts',message:'Rich Menu skip - no token',data:{userId,richMenuId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return { linked: false, message: "LINE_CHANNEL_ACCESS_TOKEN not set" };
  }

  const url = `https://api.line.me/v2/bot/user/${encodeURIComponent(userId)}/richmenu/${encodeURIComponent(richMenuId)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const resBody = await res.text();
    // #region agent log
    fetch('http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d6e810'},body:JSON.stringify({sessionId:'d6e810',hypothesisId:'richMenu',location:'richmenu.ts',message:'Rich Menu API result',data:{status:res.status,ok:res.ok,body:resBody.slice(0,500),userId,richMenuId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    if (!res.ok) {
      console.error(
        `[Rich Menu] Failed to link rich menu to user: ${res.status}`,
        resBody
      );
      return { linked: false, status: res.status, message: resBody.slice(0, 300) };
    }

    return { linked: true, status: res.status };
  } catch (err) {
    console.error("[Rich Menu] Error linking rich menu to user:", err);
    // #region agent log
    fetch('http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d6e810'},body:JSON.stringify({sessionId:'d6e810',hypothesisId:'richMenu',location:'richmenu.ts',message:'Rich Menu API throw',data:{error:err instanceof Error?err.message:String(err),userId,richMenuId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return {
      linked: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Debug helper: force-switch a user's rich menu to a known target.
 * Uses POST https://api.line.me/v2/bot/user/{userId}/richmenu/{richMenuId}.
 */
export async function debugSwitchRichMenu(
  userId: string,
  target: DebugRichMenuTarget
): Promise<RichMenuLinkResult> {
  const richMenuId = DEBUG_RICH_MENU_IDS[target];
  return linkRichMenuToUser(userId, richMenuId);
}
