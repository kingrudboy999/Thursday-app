export async function shareContent(c?: any) {
  const u = c.url ?? window.location.href,
    m = {
      title: c.title,
      text: c.text,
      url: u,
    };
  try {
    if (
      typeof navigator < "u" &&
      "share" in navigator &&
      (typeof navigator.canShare == "function" ? navigator.canShare(m) : true)
    )
      return (await navigator.share(m), "shared");
  } catch (d) {
    if (d?.name === "AbortError") return "shared";
  }
  try {
    await navigator.clipboard.writeText(u);
    return "copied";
  } catch {
    return "failed";
  }
}
