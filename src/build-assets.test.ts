import { test, expect, beforeEach, afterEach } from "bun:test"
import { mkdtemp, rm, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { runBuildAssets } from "./build-assets"

let root: string

beforeEach(async () => {
	root = await mkdtemp(path.join(tmpdir(), "build-assets-"))
	await mkdir(path.join(root, "data", "icons", "large"), { recursive: true })
	await mkdir(path.join(root, "data"), { recursive: true })

	// two icons: one listed, one orphan
	await Bun.spawn(["magick", "-size", "8x8", "xc:red", path.join(root, "data/icons/large/bitcoin.png")]).exited
	await Bun.spawn(["magick", "-size", "8x8", "xc:blue", path.join(root, "data/icons/large/some-orphan.png")])
		.exited

	await Bun.write(
		path.join(root, "data/data.json"),
		JSON.stringify([{ id: "bitcoin", symbol: "btc", name: "Bitcoin" }]),
	)
})

afterEach(async () => {
	await rm(root, { recursive: true, force: true })
})

test("emits a manifest row per icon file and a coverage report", async () => {
	await runBuildAssets(root)

	const manifest = await Bun.file(path.join(root, "data/site/index.json")).json()
	expect(manifest[0]).toEqual(["png", "jpg", "jpeg", "svg", "ico"])
	expect(manifest).toHaveLength(3) // ext table + 2 icon rows

	const rowsById = new Map(manifest.slice(1).map((row: unknown[]) => [row[0], row]))
	expect(rowsById.get("bitcoin")).toEqual(["bitcoin", "btc", "Bitcoin", 0, expect.any(String)])
	expect(rowsById.get("some-orphan")).toEqual(["some-orphan", "some-orphan", "some-orphan", 0, expect.any(String)])

	expect(await Bun.file(path.join(root, "data/icons/thumb64/bitcoin.webp")).exists()).toBe(true)
	expect(await Bun.file(path.join(root, "data/icons/thumb64/some-orphan.webp")).exists()).toBe(true)

	const coverage = await Bun.file(path.join(root, "data/site/coverage.json")).json()
	expect(coverage).toEqual({ orphanCount: 1, missingIconCount: 0 })
})

test("is incremental: a second run does not touch an already-processed icon's thumbnail", async () => {
	await runBuildAssets(root)
	const thumbPath = path.join(root, "data/icons/thumb64/bitcoin.webp")
	const firstMtime = (await Bun.file(thumbPath).stat()).mtimeMs

	await new Promise((resolve) => setTimeout(resolve, 10))
	await runBuildAssets(root)
	const secondMtime = (await Bun.file(thumbPath).stat()).mtimeMs

	expect(secondMtime).toBe(firstMtime)
})

test("skips an unreadable/unsupported icon format while still processing valid icons", async () => {
	await Bun.spawn(["magick", "-size", "8x8", "xc:green", path.join(root, "data/icons/large/badformat.gif")])
		.exited

	await runBuildAssets(root)

	const manifest = await Bun.file(path.join(root, "data/site/index.json")).json()
	const rowsById = new Map(manifest.slice(1).map((row: unknown[]) => [row[0], row]))

	expect(rowsById.has("badformat")).toBe(false)
	expect(rowsById.has("bitcoin")).toBe(true)
	expect(rowsById.has("some-orphan")).toBe(true)
	expect(manifest).toHaveLength(3) // ext table + 2 valid rows (badformat excluded)
})
