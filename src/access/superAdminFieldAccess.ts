import type { FieldAccess } from "payload";
import { isSuperAdmin } from "./isSuperAdmin";

export const superAdminFieldAccess: FieldAccess = ({ req }) =>
  isSuperAdmin(req.user);
