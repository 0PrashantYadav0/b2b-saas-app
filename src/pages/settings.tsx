import { Elysia } from "elysia";
import { BaseHtml } from "../components/base";
import { ctx } from "../context";
import { redirect } from "../lib";
import { Dashboard } from "../components/dashboard";

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
          <main class="flex-1 space-y-6 py-6 my-8">
            <h1 class="text-3xl font-bold">Organization Settings</h1>

            <form
              action="/settings/update-organization"
              method="POST"
              class="space-y-6"
            >
              <div class="flex flex-col">
                <label for="organizationName" class="text-lg font-medium">
                  Organization Name
                </label>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  class="rounded border px-4 py-2"
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
          </main>
          <h1>Under construction</h1>
        </Dashboard>
      </BaseHtml>
    ));
  })
  // under construction
  // .post("/settings/update-organization", async ({ db, session, body, set, headers }) => {
  //   if (!session) {
  //     redirect({ set, headers }, "/login");
  //     return;
  //   }

  //   const orgId = session.user.organization_id;

  //   if (!orgId) {
  //     redirect({ set, headers }, "/new-user");
  //     return;
  //   }

  //   const { organizationName } = await body();

  //   if (!organizationName || typeof organizationName !== "string") {
  //     redirect({ set, headers }, "/settings");
  //     return;
  //   }

  //   // Update organization name in the database
  //   await db.query.organizations.update({
  //     where: (organizations, { eq }) => eq(organizations.id, orgId),
  //     set: {
  //       name: organizationName,
  //     },
  //   });

  //   // Redirect back to settings page after update
  //   redirect({ set, headers }, "/settings");
  // });
