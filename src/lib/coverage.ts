export type Coverage = {
	orphanCount: number
	missingIconCount: number
}

export function computeCoverage(iconIds: string[], listedCoinIds: string[]): Coverage {
	const iconIdSet = new Set(iconIds)
	const listedIdSet = new Set(listedCoinIds)

	let orphanCount = 0
	for (const id of iconIdSet) {
		if (!listedIdSet.has(id)) orphanCount++
	}

	let missingIconCount = 0
	for (const id of listedIdSet) {
		if (!iconIdSet.has(id)) missingIconCount++
	}

	return { orphanCount, missingIconCount }
}
