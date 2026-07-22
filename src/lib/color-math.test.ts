import { test, expect } from "bun:test"
import { pixelsToDominantColor } from "./color-math"

function pixel(r: number, g: number, b: number, a: number): number[] {
	return [r, g, b, a]
}

test("returns the exact hex of a single vivid opaque pixel", () => {
	// r=220 g=20 b=20 -> h=0, s=0.909, v=0.863 (passes every filter)
	const pixels = new Uint8Array(pixel(220, 20, 20, 255))
	expect(pixelsToDominantColor(pixels)).toBe("dc1414")
})

test("falls back to grey when every pixel is fully transparent", () => {
	const pixels = new Uint8Array(pixel(255, 0, 0, 0))
	expect(pixelsToDominantColor(pixels)).toBe("808080")
})

test("falls back to grey when every pixel has zero saturation", () => {
	const pixels = new Uint8Array(pixel(128, 128, 128, 255))
	expect(pixelsToDominantColor(pixels)).toBe("808080")
})

test("falls back to grey for a near-white pixel even with a slight tint", () => {
	// r=255 g=210 b=210 -> s=0.176, v=1.0: not grey enough to hit the s<0.15
	// filter, but caught by the dedicated near-white filter (v>0.94 && s<0.25)
	const pixels = new Uint8Array(pixel(255, 210, 210, 255))
	expect(pixelsToDominantColor(pixels)).toBe("808080")
})

test("falls back to grey for a near-black pixel with a slight hue", () => {
	// r=10 g=10 b=12 -> s=0.170 (passes the grey filter), v=0.047 (<0.08)
	const pixels = new Uint8Array(pixel(10, 10, 12, 255))
	expect(pixelsToDominantColor(pixels)).toBe("808080")
})

test("weights by saturation, so fewer vivid pixels beat more muddy ones", () => {
	// 20 muddy orange pixels (h=20deg, s=0.333 each -> total weight 6.67)
	// vs 8 vivid blue pixels (h=240deg, s=0.913 each -> total weight 7.30).
	// A naive most-frequent-hue count would pick orange (20 > 8); the
	// saturation-weighted algorithm must pick blue.
	const muddy = Array.from({ length: 20 }, () => pixel(180, 140, 120, 255)).flat()
	const vivid = Array.from({ length: 8 }, () => pixel(20, 20, 230, 255)).flat()
	const pixels = new Uint8Array([...muddy, ...vivid])
	expect(pixelsToDominantColor(pixels)).toBe("1414e6")
})
