/**
 * Shallow compare two objects (only compares top-level properties)
 * @param obj1 - First object to compare
 * @param obj2 - Second object to compare
 * @returns true if objects are shallowly equal
 */
export function shallowEqual(obj1: any, obj2: any): boolean {
	if (obj1 === obj2) return true;

	if (obj1 == null || obj2 == null) return obj1 === obj2;

	if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;

	const keys1 = Object.keys(obj1);
	const keys2 = Object.keys(obj2);

	if (keys1.length !== keys2.length) return false;

	return keys1.every((key) => {
		let val1 = obj1[key];
		let val2 = obj2[key];

		if (val1 instanceof Date) {
			val1 = val1.toISOString();
		}

		if (val2 instanceof Date) {
			val2 = val2.toISOString();
		}

		return val1 === val2;
	});
}
