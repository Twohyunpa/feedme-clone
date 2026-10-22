import { ConvertError, convertUrl } from "@/lib/convert/convert-url";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    url?: unknown;
  } | null;

  try {
    const result = await convertUrl(
      typeof body?.url === "string" ? body.url : ""
    );
    return Response.json(result);
  } catch (error) {
    if (error instanceof ConvertError) {
      return Response.json(
        { code: error.code, message: error.message },
        { status: error.code === "invalid-url" ? 400 : 422 }
      );
    }
    throw error;
  }
}
