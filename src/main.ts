import path from "path"
import dataJson from "../data/data.json"
import symbolIdMapJson from "../data/symbol-id-map.json"

const symbolIdMap: Record<
	string,
	Array<{
		id: string
		alexa: number | null
		gecko_rank: number | null
		gecko_score: number
		community_score: number
	}>
> = symbolIdMapJson

const coingecko = {
	get: async (url: string) => {
		return await fetch(`https://api.coingecko.com/api/v3/${url}`, {
			headers: { "x-cg-demo-api-key": process.env.COINGECKO_API_KEY! },
		})
	},
}

const downloadImage = async (url: string, filepath: string) => {
	const img = await fetch(url, {
		headers: { "x-cg-demo-api-key": process.env.COINGECKO_API_KEY! },
	})
	await Bun.write(filepath, await img.arrayBuffer())
}

try {
	const coins: Array<{ id: string; symbol: string; name: string }> = await (
		await coingecko.get("coins/list")
	).json()

	await Bun.write("data/data.json", JSON.stringify(coins, null, 2) + "\n")

	const length = coins.length

	for (const [index, coin] of coins.entries()) {
		const ids = symbolIdMap[coin.symbol]
		if (ids !== undefined && ids.some((item) => item.id === coin.id)) {
			// console.log(`${index + 1}/${length} - ${coin.symbol} (${coin.id}) - Skipped. Already exists.`)
			continue
		}
		if (ids === undefined) {
			symbolIdMap[coin.symbol] = []
		}

		console.log(`${index + 1}/${length} - ${coin.symbol} (${coin.id}) - Fetching..`)

		const coinData: {
			id: string
			symbol: string
			name: string
			image: { thumb: string; small: string; large: string }
			public_interest_stats: { alexa_rank: number | null }
			coingecko_rank: number | null
			coingecko_score: number
			community_score: number
		} = await (await coingecko.get(`coins/${coin.id}`)).json()

		console.log(coinData)
		if (coinData.image.large.includes("missing_large")) continue

		symbolIdMap[coin.symbol].push({
			id: coin.id,
			alexa: coinData.public_interest_stats.alexa_rank,
			gecko_rank: coinData.coingecko_rank,
			gecko_score: coinData.coingecko_score,
			community_score: coinData.community_score,
		})

		await Bun.write("data/symbol-id-map.json", JSON.stringify(symbolIdMap, null, 2) + "\n")

		const fileUrl = new URL(coinData.image.large)
		const fileExt = path.extname(fileUrl.pathname)
		await downloadImage(coinData.image.large, `data/icons/large/${coin.id}${fileExt}`)
	}
} catch (e) {
	console.log(e)
	console.log("Rate limit exceeded probably.")
	process.exit(0)
}
