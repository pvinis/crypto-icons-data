import { test, expect, beforeEach, afterEach } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { normalizeExtension } from "./normalize-extension"

let dir: string

beforeEach(async () => {
	dir = await mkdtemp(path.join(tmpdir(), "normalize-ext-"))
})

afterEach(async () => {
	await rm(dir, { recursive: true, force: true })
})

async function makeFixture(name: string, format: "png" | "jpeg"): Promise<string> {
	const filePath = path.join(dir, name)
	const proc = Bun.spawn(["magick", "-size", "8x8", "xc:blue", `${format}:${filePath}`])
	await proc.exited
	return filePath
}

test("renames an uppercase-extension file to lowercase and returns it", async () => {
	const filePath = await makeFixture("icon.PNG", "png")
	const result = await normalizeExtension(filePath)
	expect(result).toBe("png")
	expect(await Bun.file(path.join(dir, "icon.png")).exists()).toBe(true)
	expect(await Bun.file(filePath).exists()).toBe(false)
})

test("leaves an already-correct lowercase extension untouched", async () => {
	const filePath = await makeFixture("icon.png", "png")
	const result = await normalizeExtension(filePath)
	expect(result).toBe("png")
	expect(await Bun.file(filePath).exists()).toBe(true)
})

test("sniffs the real format and renames a file with no extension", async () => {
	const filePath = await makeFixture("icon-noext.", "jpeg")
	const result = await normalizeExtension(filePath)
	expect(result).toBe("jpg")
	expect(await Bun.file(path.join(dir, "icon-noext.jpg")).exists()).toBe(true)
	expect(await Bun.file(filePath).exists()).toBe(false)
})

test("returns null for a format outside the frozen ext table", async () => {
	const filePath = path.join(dir, "icon-noext-gif.")
	const proc = Bun.spawn(["magick", "-size", "8x8", "xc:blue", `gif:${filePath}`])
	await proc.exited
	const result = await normalizeExtension(filePath)
	expect(result).toBeNull()
})
