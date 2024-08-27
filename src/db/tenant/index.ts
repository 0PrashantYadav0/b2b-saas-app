import { exec } from "child_process";
import { unlinkSync, writeFileSync } from "fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { config } from "../../config";
import * as schema from "./schema";

export function getTenantDb({
  dbName,
  authToken,
}: {
  dbName: string;
  authToken: string;
}) {
  const fullUrl = `libsql://${dbName}-${config.env.TURSO_ORG_SLUG}.turso.io`;

  const tenantClient = createClient({
    url: fullUrl,
    authToken,
  });

  const tenantDb = drizzle(tenantClient, { schema, logger: true });

  return {
    tenantClient,
    tenantDb,
  };
}

export async function pushToTenantDb({
  dbName,
  authToken,
  input,
}: {
  dbName: string;
  authToken: string;
  input?: boolean;
}) {
  const tempConfigPath = "./src/db/tenant/drizzle.config.ts";

  const configText = `
  export default {
    schema: "./src/db/tenant/schema/index.ts",
    driver: "turso",
    dbCredentials: {
      url: "libsql://${dbName}-${config.env.TURSO_ORG_SLUG}.turso.io",
      authToken: "${authToken}",
    },
    tablesFilter: ["!libsql_wasm_func_table"],
    dialect: "sqlite",
  }`;

  // Write the configuration file
  writeFileSync(tempConfigPath, configText);

  return new Promise((resolve, reject) => {
    // Execute the command using child_process
    const command = `bunx drizzle-kit push --config=${tempConfigPath}`;

    const proc = exec(
      command,
      { stdio: input ? "inherit" : "pipe" },
      (error, stdout, stderr) => {
        unlinkSync(tempConfigPath); // Clean up config file

        if (error) {
          console.error("Error pushing to tenant db:", stderr);
          reject(error);
        } else {
          if (input) {
            console.log(stdout);
          }
          resolve(void 0);
        }
      },
    );
  });
}
