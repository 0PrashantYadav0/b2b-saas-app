/// <reference types="lucia" />
declare namespace Lucia {
  type Auth = import("../auth/index").Auth;
  type DatabaseUserAttributes = {
    name: string;
    picture: string;
    email?: string | null;
    organization_id?: number | null;
  };
  type DatabaseSessionAttributes = {};
}
