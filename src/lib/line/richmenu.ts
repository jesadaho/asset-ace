/**
 * Link a Rich Menu to a LINE user via the Messaging API.
 * Does not throw; logs failures and returns false.
 */
export async function linkRichMenuToUser(
  userId: string,
  richMenuId: string
): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token?.trim()) {
    console.error("[Rich Menu] LINE_CHANNEL_ACCESS_TOKEN is not set");
    // #region agent log
    fetch('http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d6e810'},body:JSON.stringify({sessionId:'d6e810',hypothesisId:'richMenu',location:'richmenu.ts',message:'Rich Menu skip - no token',data:{userId,richMenuId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return false;
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
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Rich Menu] Error linking rich menu to user:", err);
    // #region agent log
    fetch('http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d6e810'},body:JSON.stringify({sessionId:'d6e810',hypothesisId:'richMenu',location:'richmenu.ts',message:'Rich Menu API throw',data:{error:err instanceof Error?err.message:String(err),userId,richMenuId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return false;
  }
}
