export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return new Response("Missing url", { status: 400 });
  }

  try {
    const res = await fetch(url);

    if (!res.ok) {
      return new Response("Failed to fetch image", { status: 500 });
    }

    const contentType = res.headers.get("content-type") || "image/webp";

    return new Response(res.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (err) {
    return new Response("Error fetching image", { status: 500 });
  }
}
