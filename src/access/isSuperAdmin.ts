import type { Access, ClientUser } from "payload";
import type { User } from "../payload-types";

export const isSuperAdminAccess: Access<User> = ({ req }) => {
	return isSuperAdmin(req.user);
};

export const isSuperAdmin = (user: User | ClientUser | null): boolean => {
	return Boolean(user?.roles?.includes("super-admin"));
};
