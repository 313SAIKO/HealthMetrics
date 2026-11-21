import {
  createAssessment,
  listAssessments,
  parseAssessmentQuery,
} from "../../../server/assessments";
import {
  handleApi,
  jsonResponse,
  readJsonBody,
  requireTrustedOrigin,
  requireUser,
  requireWriteCapacity,
} from "../../../server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleApi(async () => {
    const { database, user } = await requireUser(request);
    return jsonResponse(
      listAssessments(
        database,
        user.id,
        parseAssessmentQuery(new URL(request.url).searchParams),
      ),
    );
  });
}

export async function POST(request: Request): Promise<Response> {
  return handleApi(async () => {
    requireTrustedOrigin(request);
    const { database, user } = await requireUser(request);
    requireWriteCapacity(user.id);
    return jsonResponse(
      createAssessment(database, user.id, await readJsonBody(request)),
      201,
    );
  });
}
