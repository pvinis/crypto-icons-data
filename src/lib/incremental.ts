export function shouldSkipIcon(params: { thumbnailExists: boolean; previousColourHex: string | undefined }): boolean {
	return params.thumbnailExists && params.previousColourHex !== undefined
}
