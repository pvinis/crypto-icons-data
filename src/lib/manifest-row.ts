import { EXT_TABLE } from "../constants"

export type ManifestRow = [string, string, string, number, string]

export function buildManifestRow(
	icon: { id: string; ext: string; colourHex: string },
	listedCoin: { symbol: string; name: string } | undefined,
): ManifestRow {
	const extIndex = (EXT_TABLE as readonly string[]).indexOf(icon.ext)
	if (extIndex === -1) {
		throw new Error(`extension "${icon.ext}" for icon "${icon.id}" is not in the frozen EXT_TABLE`)
	}

	const symbol = listedCoin?.symbol ?? icon.id
	const name = listedCoin?.name ?? icon.id

	return [icon.id, symbol, name, extIndex, icon.colourHex]
}
