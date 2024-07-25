/**
 * @file tests/index.test.ts
 * @description This file contains the tests for the LastFMHandler class.
 *
 * @author Tom Planche
 * @license unlicense
 */

import LastFMHandler from "../LastFMHandler";

describe("LastFMHandler Tests", () => {
	it("should return the same instance", () => {
		const instance1 = LastFMHandler.getInstance("tom_planche");
		const instance2 = LastFMHandler.getInstance("tom_planche");

		expect(instance1).toBe(instance2);
	});
});
