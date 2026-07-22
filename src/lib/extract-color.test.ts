import { test, expect } from "bun:test"
import path from "node:path"
import { extractDominantColor } from "./extract-color"

const FIXTURES = path.join(import.meta.dir, "__fixtures__")

function channelDeltas(hexA: string, hexB: string): number[] {
	const a = [hexA.slice(0, 2), hexA.slice(2, 4), hexA.slice(4, 6)].map((h) => parseInt(h, 16))
	const b = [hexB.slice(0, 2), hexB.slice(2, 4), hexB.slice(4, 6)].map((h) => parseInt(h, 16))
	return a.map((v, i) => Math.abs(v - b[i]!))
}

const TOLERANCE = 40

test("bitcoin extracts within tolerance of the brand colour #F7931A", async () => {
	const hex = await extractDominantColor(path.join(FIXTURES, "bitcoin.png"))
	for (const delta of channelDeltas(hex, "f7931a")) {
		expect(delta).toBeLessThanOrEqual(TOLERANCE)
	}
})

test("BNB extracts within tolerance of the brand colour #F3BA2F", async () => {
	const hex = await extractDominantColor(path.join(FIXTURES, "binancecoin.png"))
	for (const delta of channelDeltas(hex, "f3ba2f")) {
		expect(delta).toBeLessThanOrEqual(TOLERANCE)
	}
})

test("Chainlink extracts within tolerance of the brand colour #2A5ADA", async () => {
	const hex = await extractDominantColor(path.join(FIXTURES, "chainlink.png"))
	for (const delta of channelDeltas(hex, "2a5ada")) {
		expect(delta).toBeLessThanOrEqual(TOLERANCE)
	}
})

test("IOST (a monochrome logo) correctly yields the grey fallback", async () => {
	const hex = await extractDominantColor(path.join(FIXTURES, "iostoken.png"))
	expect(hex).toBe("808080")
})
