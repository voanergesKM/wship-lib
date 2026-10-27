import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/admin/access";
import { adminErrorResponse } from "@/lib/admin/errors";
import { saveAdminProfile } from "@/lib/admin/mutations";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSuperadmin("permissionProfiles.update");
    await saveAdminProfile(user, await request.json(), (await params).id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
