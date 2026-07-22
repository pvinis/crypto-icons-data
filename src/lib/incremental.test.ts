import { test, expect } from "bun:test"
import { shouldSkipIcon } from "./incremental"

test("skips when both the thumbnail and a previous colour already exist", () => {
	expect(shouldSkipIcon({ thumbnailExists: true, previousColourHex: "f79824" })).toBe(true)
})

test("does not skip when the thumbnail is missing", () => {
	expect(shouldSkipIcon({ thumbnailExists: false, previousColourHex: "f79824" })).toBe(false)
})

test("does not skip when there is no previous colour", () => {
	expect(shouldSkipIcon({ thumbnailExists: true, previousColourHex: undefined })).toBe(false)
})

test("does not skip when neither exists (a brand-new icon)", () => {
	expect(shouldSkipIcon({ thumbnailExists: false, previousColourHex: undefined })).toBe(false)
})
