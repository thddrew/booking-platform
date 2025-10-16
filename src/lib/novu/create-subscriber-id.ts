export const createSubscriberId = (tenantId: string, customerId: string) => {
	return [tenantId, customerId].join(":");
};
