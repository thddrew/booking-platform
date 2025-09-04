import type { FieldAccess } from "payload";
import { isSuperAdmin } from "./isSuperAdmin";
import { User } from "@/payload-types";

export const superAdminFieldAccess: FieldAccess<User> = ({ req }) =>
  isSuperAdmin(req.user);
