import { Elysia } from "elysia";
import { BaseHtml } from "../components/base";
import { ctx } from "../context";
import { redirect } from "../lib";
import { Dashboard } from "../components/dashboard";
import { getTenantDb } from "../db/tenant";

export const settings = new Elysia()
  .use(ctx)
  .get("/settings", async ({ db, session, set, headers, html }) => {
    if (!session) {
      redirect({ set, headers }, "/login");
      return;
    }

    const orgId = session.user.organization_id;

    if (!orgId) {
      redirect({ set, headers }, "/new-user");
      return;
    }

    const organization = await db.query.organizations.findFirst({
      where: (organizations, { eq }) => eq(organizations.id, orgId),
    });

    if (!organization) {
      redirect({ set, headers }, "/new-user");
      return;
    }

    return html(() => (
      <BaseHtml>
        <Dashboard>
          <div class="py-8 px-10">
            <h1 class="text-3xl font-semibold">Organization Settings</h1>
            <form
              action="/seettings"
              method="POST"
              class="py-8"
            >
              <div class="flex flex-col">
                <label for="organizationName" class="text-lg font-medium py-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  class="rounded border px-4 py-2 my-2"
                  value={organization.name}
                />
              </div>
              <button
                type="submit"
                class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-800"
              >
                Save Changes
              </button>
            </form>
          </div>
        </Dashboard>
      </BaseHtml>
    ));
  })
  .post("/settings", async ({ db, session, set, headers, html }) => {
    if (!session) {
      redirect({ set, headers }, "/login");
      return;
    }

    const orgId = session.user.organization_id;

    if (!orgId) {
      redirect({ set, headers }, "/new-user");
      return;
    }

    const organization = await db.query.organizations.findFirst({
      where: (organizations, { eq }) => eq(organizations.id, orgId),
    });

    if (!organization) {
      redirect({ set, headers }, "/new-user");
      return;
    }

    const { tenantDb } = getTenantDb({
      dbName: organization.database_name,
      authToken: organization.database_auth_token,
    });

    if (!organization) {
      redirect({ set, headers }, "/new-user");
      return;
    }
    
    // return (
    //   <h1>hello</h1>
    // )
  })