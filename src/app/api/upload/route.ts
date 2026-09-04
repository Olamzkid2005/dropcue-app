import { NextRequest } from "next/server";
import { createUploadUrl } from "@/modules/files/server/actions";
import { uploadUrlSchema } from "@/modules/files/validations";
import { handleApiError } from "@/lib/errors";
import { rateLimit } from "@/lib/security/api-rate-limit";

export async function POST(request: NextRequest) {
  const rateLimited = await rateLimit(request, "upload");
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();

    const parsed = uploadUrlSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const result = await createUploadUrl(parsed.data);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json(result.data);
  } catch (error) {
    return handleApiError(error);
  }
}
