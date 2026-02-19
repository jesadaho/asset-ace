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

    if (!res.ok) {
      const body = await res.text();
      console.error(
        `[Rich Menu] Failed to link rich menu to user: ${res.status}`,
        body
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Rich Menu] Error linking rich menu to user:", err);
    return false;
  }
}
