import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin/access";
import { adminErrorResponse } from "@/lib/admin/errors";
import { updateAdminUser } from "@/lib/admin/mutations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAdminPermission("admin.access");
    await updateAdminUser(user, (await params).id, await request.json());
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
