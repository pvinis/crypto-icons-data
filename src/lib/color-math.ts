export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
	const rf = r / 255
	const gf = g / 255
	const bf = b / 255
	const max = Math.max(rf, gf, bf)
	const min = Math.min(rf, gf, bf)
	const d = max - min

	let h = 0
	if (d !== 0) {
		if (max === rf) h = ((gf - bf) / d) % 6
		else if (max === gf) h = (bf - rf) / d + 2
		else h = (rf - gf) / d + 4
		h *= 60
		if (h < 0) h += 360
	}

	const s = max === 0 ? 0 : d / max
	const v = max
	return { h, s, v }
}

const HUE_BUCKETS = 36 // 10-degree buckets
const ALPHA_THRESHOLD = 128
const MIN_SATURATION = 0.15
const NEAR_WHITE_VALUE = 0.94
const NEAR_WHITE_SATURATION = 0.25
const NEAR_BLACK_VALUE = 0.08
const FALLBACK_HEX = "808080"

function toHex(n: number): string {
	return Math.round(n).toString(16).padStart(2, "0")
}

export function pixelsToDominantColor(pixels: Uint8Array): string {
	const pixelCount = Math.floor(pixels.length / 4)
	const weight = new Array<number>(HUE_BUCKETS).fill(0)
	const sumR = new Array<number>(HUE_BUCKETS).fill(0)
	const sumG = new Array<number>(HUE_BUCKETS).fill(0)
	const sumB = new Array<number>(HUE_BUCKETS).fill(0)
	const count = new Array<number>(HUE_BUCKETS).fill(0)

	for (let i = 0; i < pixelCount; i++) {
		const r = pixels[i * 4]!
		const g = pixels[i * 4 + 1]!
		const b = pixels[i * 4 + 2]!
		const a = pixels[i * 4 + 3]!
		if (a < ALPHA_THRESHOLD) continue

		const { h, s, v } = rgbToHsv(r, g, b)
		if (s < MIN_SATURATION) continue
		if (v > NEAR_WHITE_VALUE && s < NEAR_WHITE_SATURATION) continue
		if (v < NEAR_BLACK_VALUE) continue

		const bucket = Math.floor(h / 10) % HUE_BUCKETS
		weight[bucket] += s
		sumR[bucket] += r
		sumG[bucket] += g
		sumB[bucket] += b
		count[bucket] += 1
	}

	let bestBucket = -1
	let bestWeight = 0
	for (let i = 0; i < HUE_BUCKETS; i++) {
		if (weight[i]! > bestWeight) {
			bestWeight = weight[i]!
			bestBucket = i
		}
	}

	if (bestBucket === -1 || count[bestBucket] === 0) return FALLBACK_HEX

	const n = count[bestBucket]!
	return toHex(sumR[bestBucket]! / n) + toHex(sumG[bestBucket]! / n) + toHex(sumB[bestBucket]! / n)
}
