import { readdir, mkdir } from "node:fs/promises"
import path from "node:path"
import { EXT_TABLE } from "./constants"
import { CoinsListSchema } from "./types"
import { buildManifestRow, type ManifestRow } from "./lib/manifest-row"
import { normalizeExtension } from "./lib/normalize-extension"
import { generateThumbnail } from "./lib/thumbnail"
import { extractDominantColor } from "./lib/extract-color"
import { shouldSkipIcon } from "./lib/incremental"
import { computeCoverage } from "./lib/coverage"

async function loadPreviousManifest(siteDir: string): Promise<Map<string, string>> {
	const file = Bun.file(path.join(siteDir, "index.json"))
	if (!(await file.exists())) return new Map()

	const raw = (await file.json()) as [string[], ...ManifestRow[]]
	const [, ...rows] = raw
	const map = new Map<string, string>()
	for (const row of rows) {
		map.set(row[0], row[4])
	}
	return map
}

export async function runBuildAssets(root: string): Promise<void> {
	const largeDir = path.join(root, "data/icons/large")
	const thumbDir = path.join(root, "data/icons/thumb64")
	const siteDir = path.join(root, "data/site")

	await mkdir(thumbDir, { recursive: true })
	await mkdir(siteDir, { recursive: true })

	const coins = CoinsListSchema.parse(await Bun.file(path.join(root, "data/data.json")).json())
	const coinsById = new Map(coins.map((c) => [c.id, { symbol: c.symbol, name: c.name }]))

	const previousColours = await loadPreviousManifest(siteDir)
	const files = await readdir(largeDir)

	const rows: ManifestRow[] = []
	const iconIds: string[] = []
	let skippedCount = 0

	for (const file of files) {
		const finalExt = await normalizeExtension(path.join(largeDir, file))
		if (finalExt === null) {
			skippedCount++
			console.warn(`skipping ${file}: unrecognized or unreadable image format`)
			continue
		}

		const id = path.basename(file, path.extname(file))

		try {
			const sourcePath = path.join(largeDir, `${id}.${finalExt}`)
			const thumbPath = path.join(thumbDir, `${id}.webp`)
			const thumbExists = await Bun.file(thumbPath).exists()
			const previousColourHex = previousColours.get(id)

			let colourHex: string
			if (shouldSkipIcon({ thumbnailExists: thumbExists, previousColourHex })) {
				colourHex = previousColourHex!
			} else {
				await generateThumbnail(sourcePath, thumbPath)
				colourHex = await extractDominantColor(sourcePath)
			}

			rows.push(buildManifestRow({ id, ext: finalExt, colourHex }, coinsById.get(id)))
			iconIds.push(id)
		} catch (err) {
			skippedCount++
			console.warn(`skipping ${file}: processing failed - ${err}`)
			continue
		}
	}

	await Bun.write(path.join(siteDir, "index.json"), JSON.stringify([EXT_TABLE, ...rows]))

	const coverage = computeCoverage(
		iconIds,
		coins.map((c) => c.id),
	)
	await Bun.write(path.join(siteDir, "coverage.json"), JSON.stringify(coverage, null, 2) + "\n")

	console.log(`processed ${rows.length} icons`)
	console.log(`coverage: ${coverage.orphanCount} orphans, ${coverage.missingIconCount} listed coins missing an icon`)
	if (skippedCount > 0) console.warn(`skipped ${skippedCount} icon(s) with an unrecognized or unreadable format`)
}

if (import.meta.main) {
	await runBuildAssets(process.cwd())
}
