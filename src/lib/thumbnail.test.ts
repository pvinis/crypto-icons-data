import { test, expect, beforeEach, afterEach } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { generateThumbnail } from "./thumbnail"

let dir: string
let inputPath: string

beforeEach(async () => {
	dir = await mkdtemp(path.join(tmpdir(), "thumbnail-"))
	inputPath = path.join(dir, "source.png")
	// a non-square source, to prove fit-inside-and-pad rather than crop
	const proc = Bun.spawn(["magick", "-size", "40x100", "xc:red", inputPath])
	await proc.exited
})

afterEach(async () => {
	await rm(dir, { recursive: true, force: true })
})

test("produces a 64x64 WEBP regardless of the source aspect ratio", async () => {
	const outputPath = path.join(dir, "thumb.webp")
	await generateThumbnail(inputPath, outputPath)

	const identify = Bun.spawn(["magick", "identify", "-format", "%wx%h %m", outputPath], { stdout: "pipe" })
	const out = (await new Response(identify.stdout).text()).trim()
	await identify.exited

	expect(out).toBe("64x64 WEBP")
})

test("throws with a clear message when the input does not exist", async () => {
	await expect(generateThumbnail(path.join(dir, "missing.png"), path.join(dir, "out.webp"))).rejects.toThrow(
		/magick thumbnail failed/,
	)
})
