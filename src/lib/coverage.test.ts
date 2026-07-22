import { test, expect } from "bun:test"
import { computeCoverage } from "./coverage"

test("counts icons whose id is not in the listed coins as orphans", () => {
	const result = computeCoverage(["bitcoin", "some-delisted-coin", "ethereum"], ["bitcoin", "ethereum"])
	expect(result.orphanCount).toBe(1)
})

test("counts listed coins that have no icon file as missing", () => {
	const result = computeCoverage(["bitcoin"], ["bitcoin", "ethereum", "solana"])
	expect(result.missingIconCount).toBe(2)
})

test("returns zero for both when the sets match exactly", () => {
	const result = computeCoverage(["bitcoin", "ethereum"], ["bitcoin", "ethereum"])
	expect(result).toEqual({ orphanCount: 0, missingIconCount: 0 })
})

test("handles empty inputs", () => {
	expect(computeCoverage([], [])).toEqual({ orphanCount: 0, missingIconCount: 0 })
})
