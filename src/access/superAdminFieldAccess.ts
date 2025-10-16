import type { FieldAccess } from "payload";
import type { User } from "@/payload-types";
import { isSuperAdmin } from "./isSuperAdmin";

export const superAdminFieldAccess: FieldAccess<User> = ({ req }) =>
	isSuperAdmin(req.user);
