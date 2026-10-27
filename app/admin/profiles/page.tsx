import { requireAdminPage } from "@/lib/admin/access";
import { getAdminProfiles } from "@/lib/admin/data";
import {
  SYSTEM_PERMISSIONS,
  SUPERADMIN_PROFILE_ID,
} from "@/lib/permissions/catalog";
import { PermissionProfileForm } from "../_components/PermissionProfileForm";
export default async function Page() {
  const user = await requireAdminPage("permissionProfiles.read");
  const profiles = await getAdminProfiles();
  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold">Профілі доступу</h1>
      {user.isSuperadmin && (
        <details className="rounded-xl border p-4">
          <summary className="cursor-pointer font-medium">
            Створити профіль
          </summary>
          <div className="pt-4">
            <PermissionProfileForm />
          </div>
        </details>
      )}
      {profiles.map((profile) => (
        <details key={profile._id} className="rounded-xl border p-4">
          <summary className="cursor-pointer font-medium">
            {profile.name}
            {profile.isSystem ? " · системний" : ""}
          </summary>
          <div className="flex flex-col gap-3 pt-4">
            {profile._id === SUPERADMIN_PROFILE_ID ? (
              <p>Повний доступ до всіх поточних і майбутніх системних дій.</p>
            ) : user.isSuperadmin ? (
              <PermissionProfileForm profile={profile} />
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {profile.description}
                </p>
                <ul className="list-inside list-disc text-sm">
                  {profile.permissions.map((key) => (
                    <li key={key}>{SYSTEM_PERMISSIONS[key]}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </details>
      ))}
      {profiles.length === 0 && (
        <p className="text-muted-foreground">
          Профілі ще не створені. Потрібна міграція доступу.
        </p>
      )}
    </section>
  );
}
