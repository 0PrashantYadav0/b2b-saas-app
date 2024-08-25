import Elysia from "elysia";
import { authGroup } from "./(auth)/*";
import { orgId } from "./<organizationId>/*";
import { customerRoute } from "./customer";
import { dashboard } from "./dashboard";
import { index } from "./index";
import { newUser } from "./new-user";
import { organization } from "./organization";
import { settings } from "./settings";
import { ticketsRoute } from "./tickets";

export const pages = new Elysia()
  .use(index)
  .use(ticketsRoute)
  .use(orgId)
  .use(organization)
  .use(authGroup)
  .use(newUser)
  .use(dashboard)
  .use(customerRoute)
  .use(settings);
