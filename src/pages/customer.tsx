import Elysia from "elysia";
import { ctx } from "../context";
import { redirect } from "../lib";
import { getTenantDb } from "../db/tenant";
import { BaseHtml } from "../components/base";
import { Dashboard } from "../components/dashboard";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { tickets } from "../db/tenant/schema";

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

    const [[openTickets], [closedTickets], [openTicketsInLastWeek] , [closedTicketsInLastWeek]] = await tenantDb.batch([
      tenantDb
        .select({
          count: sql<number>`count(*)`,
        })
        .from(tickets)
        .where(eq(tickets.status, "open")),
      tenantDb
        .select({
          count: sql<number>`count(*)`,
        })
        .from(tickets)
        .where(eq(tickets.status, "closed")),
      tenantDb
        .select({
          count: sql<number>`count(*)`,
        })
        .from(tickets)
        .where(
          and(
            eq(tickets.status, "open"),
            gt(
              tickets.created_at,
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            ),
            lt(tickets.created_at, new Date(Date.now())),
          ),
        ),
      tenantDb
        .select({
          count: sql<number>`count(*)`,
        })
        .from(tickets)
        .where(
          and(
            eq(tickets.status, "closed"),
            gt(
              tickets.closed_at,
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            ),
            lt(tickets.closed_at, new Date(Date.now())),
          ),
        ),
    ]);

    const openTicketCount = openTickets?.count ?? 0;
    const closedTicketCount = closedTickets?.count ?? 0;

    const closedTicketCountInLastWeek = closedTicketsInLastWeek?.count ?? 0;
    const openTicketCountInLastWeek = openTicketsInLastWeek?.count ?? 0;

    const totalTicketsLastWeek = closedTicketCountInLastWeek + openTicketCountInLastWeek ;

    let customerSatisfactionRatioInLastWeek = (closedTicketCountInLastWeek/totalTicketsLastWeek)*100;

    if(totalTicketsLastWeek === 0){
      customerSatisfactionRatioInLastWeek = 0;
    }

    const totalTickets = openTicketCount+closedTicketCount;
    let overAllCustomerSatisfactionRatio = (closedTicketCount/totalTickets)*100;

    if(totalTickets === 0){
      overAllCustomerSatisfactionRatio = 0;
    }
    
    return html(() => (
      <>
      <html>
        <head>
          <style>
            {`
              @property --p{
                syntax: '<number>';
                inherits: true;
                initial-value: 0;
              }

              .pie {
                --p:20;
                --b:22px;
                --c:darkred;
                --w:200px;
                
                width:var(--w);
                aspect-ratio:1;
                position:relative;
                display:inline-grid;
                margin:5px;
                place-content:center;
                font-size:30px;
                font-weight:bold;
                font-family:sans-serif;
              }
              .pie:before,
              .pie:after {
                content:"";
                position:absolute;
                border-radius:50%;
              }
              .pie:before {
                inset:0;
                background:
                  radial-gradient(farthest-side,var(--c) 98%,#0000) top/var(--b) var(--b) no-repeat,
                  conic-gradient(var(--c) calc(var(--p)*1%),#0000 0);
                -webkit-mask:radial-gradient(farthest-side,#0000 calc(99% - var(--b)),#000 calc(100% - var(--b)));
                        mask:radial-gradient(farthest-side,#0000 calc(99% - var(--b)),#000 calc(100% - var(--b)));
              }
              .pie:after {
                inset:calc(50% - var(--b)/2);
                background:var(--c);
                transform:rotate(calc(var(--p)*3.6deg)) translateY(calc(50% - var(--w)/2));
              }
              .animate {
                animation:p 1s .5s both;
              }
              .no-round:before {
                background-size:0 0,auto;
              }
              .no-round:after {
                content:none;
              }
              @keyframes p {
                from{--p:0}
              }

              body {
                background:#f2f2f2;
              }
            `}
          </style>
        </head>
      </html>
      <BaseHtml>
        <Dashboard>
          <h1  class="text-3xl font-bold py-10 px-8">Customer Satisfaction Ratio</h1>
          <div class="flex justify-around py-4 px-8 items-start h-full">
            <div class="py-2">
              <p class="text-xl font-bold py-4">Over All Ratio Of Customer Satisfaction</p>
              <p class="py-2 text-lg font-semibold">Total Open Tickets : {openTicketCount} </p>
              <p class="py-2 text-lg font-semibold">Total Closed Tickets : {closedTicketCount} </p>
              <div class="pie animate py-4" style={`--p:${overAllCustomerSatisfactionRatio.toPrecision(2)}; --c:orange;`}> {overAllCustomerSatisfactionRatio.toPrecision(2)}%</div>
            </div>
            <div class="py-2">
              <p class="text-xl font-bold py-4">Ratio Of Customer Satisfaction Last Week</p>
              <p class="py-2 text-lg font-semibold">Total Open Tickets Last Week : {openTicketCountInLastWeek} </p>
              <p class="py-2 text-lg font-semibold">Total Closed Tickets Last Week : {closedTicketCountInLastWeek} </p>
              <div class="pie animate py-4" style={`--p:${customerSatisfactionRatioInLastWeek.toPrecision(2)}; --c:darkblue;`}> {customerSatisfactionRatioInLastWeek.toPrecision(2)}%</div>
            </div>
          </div>
        </Dashboard>
      </BaseHtml>
      </>
    ))
  })