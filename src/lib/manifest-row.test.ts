import { test, expect } from "bun:test"
import { buildManifestRow } from "./manifest-row"

test("builds a row for a coin still in the current list", () => {
	const row = buildManifestRow({ id: "bitcoin", ext: "png", colourHex: "f79824" }, { symbol: "btc", name: "Bitcoin" })
	expect(row).toEqual(["bitcoin", "btc", "Bitcoin", 0, "f79824"])
})

test("falls back to id for both name and symbol when the coin is an orphan", () => {
	const row = buildManifestRow({ id: "some-delisted-coin", ext: "jpg", colourHex: "336699" }, undefined)
	expect(row).toEqual(["some-delisted-coin", "some-delisted-coin", "some-delisted-coin", 1, "336699"])
})

test("resolves extIndex correctly for every entry in the frozen ext table", () => {
	expect(buildManifestRow({ id: "a", ext: "png", colourHex: "000000" }, { symbol: "a", name: "A" })[3]).toBe(0)
	expect(buildManifestRow({ id: "b", ext: "jpg", colourHex: "000000" }, { symbol: "b", name: "B" })[3]).toBe(1)
	expect(buildManifestRow({ id: "c", ext: "jpeg", colourHex: "000000" }, { symbol: "c", name: "C" })[3]).toBe(2)
	expect(buildManifestRow({ id: "d", ext: "svg", colourHex: "000000" }, { symbol: "d", name: "D" })[3]).toBe(3)
	expect(buildManifestRow({ id: "e", ext: "ico", colourHex: "000000" }, { symbol: "e", name: "E" })[3]).toBe(4)
})

test("throws loudly for an extension outside the frozen table (an upstream bug, not user data)", () => {
	expect(() => buildManifestRow({ id: "z", ext: "gif", colourHex: "000000" }, undefined)).toThrow(/gif/)
})
