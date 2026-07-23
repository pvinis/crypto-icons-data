import { rename } from "node:fs/promises"
import path from "node:path"
import { EXT_TABLE } from "../constants"

const MAGICK_FORMAT_TO_EXT: Record<string, string> = {
	PNG: "png",
	JPEG: "jpg",
	SVG: "svg",
	ICO: "ico",
}

async function sniffFormat(filePath: string): Promise<string | null> {
	const proc = Bun.spawn(["magick", "identify", "-format", "%m", `${filePath}[0]`], { stdout: "pipe" })
	const out = await new Response(proc.stdout).text()
	await proc.exited
	return MAGICK_FORMAT_TO_EXT[out.trim()] ?? null
}

export async function normalizeExtension(filePath: string): Promise<string | null> {
	const dir = path.dirname(filePath)
	const rawExt = path.extname(filePath).slice(1)
	const currentExt = rawExt.toLowerCase()
	const base = path.basename(filePath, path.extname(filePath))

	if ((EXT_TABLE as readonly string[]).includes(currentExt)) {
		if (rawExt === currentExt) return currentExt // already correct, no rename needed
		const correctedPath = path.join(dir, `${base}.${currentExt}`)
		await rename(filePath, correctedPath)
		return currentExt
	}

	const sniffed = await sniffFormat(filePath)
	if (sniffed === null) return null

	const correctedPath = path.join(dir, `${base}.${sniffed}`)
	await rename(filePath, correctedPath)
	return sniffed
}
