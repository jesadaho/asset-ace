/**
 * Send a text message to a LINE user via Push API.
 * Does not throw; logs failures and returns success boolean.
 */
export async function pushMessage(
  toUserId: string,
  text: string
): Promise<{ sent: boolean; status?: number; message?: string }> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token?.trim()) {
    console.error("[LINE Push] LINE_CHANNEL_ACCESS_TOKEN is not set");
    return { sent: false, message: "LINE_CHANNEL_ACCESS_TOKEN not set" };
  }

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: toUserId,
        messages: [{ type: "text", text }],
      }),
    });

    const resBody = await res.text();
    if (!res.ok) {
      console.error("[LINE Push] Failed to send:", res.status, resBody);
      return { sent: false, status: res.status, message: resBody.slice(0, 300) };
    }
    return { sent: true, status: res.status };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[LINE Push] Error:", msg);
    return { sent: false, message: msg };
  }
}
