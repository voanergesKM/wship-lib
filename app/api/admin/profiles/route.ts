import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/admin/access";
import { adminErrorResponse } from "@/lib/admin/errors";
import { saveAdminProfile } from "@/lib/admin/mutations";
export async function POST(request: Request) {
  try {
    const user = await requireSuperadmin("permissionProfiles.create");
    const id = await saveAdminProfile(user, await request.json());
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
