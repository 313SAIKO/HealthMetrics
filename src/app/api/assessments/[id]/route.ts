import {
  deleteAssessment,
  getAssessment,
  updateAssessment,
} from "../../../../server/assessments";
import {
  handleApi,
  jsonResponse,
  readJsonBody,
  requireTrustedOrigin,
  requireUser,
  requireWriteCapacity,
} from "../../../../server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  return handleApi(async () => {
    const { database, user } = await requireUser(request);
    const { id } = await context.params;
    return jsonResponse(getAssessment(database, user.id, id));
  });
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  return handleApi(async () => {
    requireTrustedOrigin(request);
    const { database, user } = await requireUser(request);
    requireWriteCapacity(user.id);
    const { id } = await context.params;
    return jsonResponse(
      updateAssessment(database, user.id, id, await readJsonBody(request)),
    );
  });
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  return handleApi(async () => {
    requireTrustedOrigin(request);
    const { database, user } = await requireUser(request);
    requireWriteCapacity(user.id);
    const { id } = await context.params;
    deleteAssessment(database, user.id, id);
    return new Response(null, { status: 204 });
  });
}
