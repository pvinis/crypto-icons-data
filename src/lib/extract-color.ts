import { pixelsToDominantColor } from "./color-math"

const SAMPLE_SIZE = 32

async function getRawRgba(inputPath: string): Promise<Uint8Array> {
	const proc = Bun.spawn(
		[
			"magick",
			`${inputPath}[0]`,
			"-resize",
			`${SAMPLE_SIZE}x${SAMPLE_SIZE}`,
			"-background",
			"none",
			"-alpha",
			"on",
			"RGBA:-",
		],
		{ stdout: "pipe", stderr: "pipe" },
	)
	const buf = await new Response(proc.stdout).arrayBuffer()
	const exitCode = await proc.exited
	if (exitCode !== 0) {
		const stderr = await new Response(proc.stderr).text()
		throw new Error(`magick colour sampling failed for ${inputPath}: ${stderr}`)
	}
	return new Uint8Array(buf)
}

export async function extractDominantColor(inputPath: string): Promise<string> {
	const pixels = await getRawRgba(inputPath)
	return pixelsToDominantColor(pixels)
}
