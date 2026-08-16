import { desc, eq } from "drizzle-orm";
import { ensureRequirementsTable, getDb } from "../../../db";
import { requirements } from "../../../db/schema";

function messageFor(error: unknown) {
  const message = error instanceof Error ? error.message : "未知错误";
  if (message.includes("no such table")) return "需求记录表尚未初始化，请稍后重试。";
  return message;
}

export async function GET() {
  try {
    await ensureRequirementsTable();
    const rows = await getDb().select().from(requirements).orderBy(desc(requirements.updatedAt), desc(requirements.id)).limit(200);
    return Response.json({ requirements: rows });
  } catch (error) {
    return Response.json({ error: messageFor(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureRequirementsTable();
    const body = (await request.json()) as Partial<typeof requirements.$inferInsert>;
    const project = body.project?.trim() ?? "";
    const title = body.title?.trim() ?? "";
    if (!project || !title) return Response.json({ error: "项目和需求标题不能为空。" }, { status: 400 });
    const [created] = await getDb().insert(requirements).values({
      project,
      title,
      description: body.description?.trim() ?? "",
      priority: body.priority?.trim() || "P1",
      status: body.status?.trim() || "待评估",
      progress: Math.max(0, Math.min(100, Number(body.progress ?? 0))),
      progressNote: body.progressNote?.trim() ?? "",
      owner: body.owner?.trim() ?? "",
    }).returning();
    return Response.json({ requirement: created }, { status: 201 });
  } catch (error) {
    return Response.json({ error: messageFor(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureRequirementsTable();
    const body = (await request.json()) as { id?: number; status?: string; progress?: number; progressNote?: string; owner?: string; priority?: string };
    if (!body.id) return Response.json({ error: "缺少需求编号。" }, { status: 400 });
    const [updated] = await getDb().update(requirements).set({
      status: body.status?.trim() || "待评估",
      progress: Math.max(0, Math.min(100, Number(body.progress ?? 0))),
      progressNote: body.progressNote?.trim() ?? "",
      owner: body.owner?.trim() ?? "",
      priority: body.priority?.trim() || "P1",
      updatedAt: new Date().toISOString(),
    }).where(eq(requirements.id, body.id)).returning();
    if (!updated) return Response.json({ error: "未找到该需求。" }, { status: 404 });
    return Response.json({ requirement: updated });
  } catch (error) {
    return Response.json({ error: messageFor(error) }, { status: 500 });
  }
}
