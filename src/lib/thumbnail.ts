export async function generateThumbnail(inputPath: string, outputPath: string): Promise<void> {
	const proc = Bun.spawn(
		[
			"magick",
			`${inputPath}[0]`,
			"-resize",
			"64x64",
			"-background",
			"none",
			"-gravity",
			"center",
			"-extent",
			"64x64",
			"-define",
			"webp:lossless=false",
			"-quality",
			"82",
			outputPath,
		],
		{ stdout: "pipe", stderr: "pipe" },
	)
	const exitCode = await proc.exited
	if (exitCode !== 0) {
		const stderr = await new Response(proc.stderr).text()
		throw new Error(`magick thumbnail failed for ${inputPath}: ${stderr}`)
	}
}
