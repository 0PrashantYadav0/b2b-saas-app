import Elysia from "elysia";
import { ctx } from "../context";
import { redirect } from "../lib";
import { getTenantDb } from "../db/tenant";
import { BaseHtml } from "../components/base";
import { Dashboard } from "../components/dashboard";

export const customerRoute = new Elysia()
  .use(ctx)
  .get("/customer", async ({ db, session, set, headers, html, config }) => {
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

    const tickets = await tenantDb.query.tickets.findMany({
      orderBy: (tickets, { desc }) => desc(tickets.created_at),
    });

    
    return html(() => (
      <BaseHtml>
        <Dashboard>
            Come Soon
        </Dashboard>
      </BaseHtml>
    ))
  })