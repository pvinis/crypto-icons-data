import z from "zod"

export const CoinSchema = z.object({
	id: z.string(),
	symbol: z.string(),
	name: z.string(),
})

export const CoinsListSchema = z.array(CoinSchema)

// https://docs.coingecko.com/reference/coins-id
// TODO: maybe we can add some more fields?
export const CoinDetailSchema = z.object({
	id: z.string(),
	symbol: z.string(),
	name: z.string(),
	image: z.object({
		thumb: z.string(),
		small: z.string(),
		large: z.string(),
	}),
})
