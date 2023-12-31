import path from "path"
import { last } from "lodash"
import symbolIdMapJson from "../data/symbol-id-map.json"

const pro = true

const symbolIdMap: Record<
	string,
	Array<{
		id: string
		alexa: number | null
		gecko_rank: number | null
		gecko_score: number
		community_score: number
		image: {
			thumb: string
			small: string
			large: string
		}
	}>
> = symbolIdMapJson

const coingecko = {
	get: async (url: string) => {
		const apiUrl = pro
			? "https://pro-api.coingecko.com/api/v3/"
			: "https://api.coingecko.com/api/v3/"
		return await fetch(apiUrl + url, {
			headers: pro
				? { "x-cg-pro-api-key": Bun.env.COINGECKO_PRO_API_KEY! }
				: { "x-cg-demo-api-key": Bun.env.COINGECKO_DEMO_API_KEY! },
		})
	},
}

const downloadImage = async (url: string, filepath: string) => {
	const img = await fetch(url, {
		headers: pro
			? { "x-cg-pro-api-key": Bun.env.COINGECKO_PRO_API_KEY! }
			: { "x-cg-demo-api-key": Bun.env.COINGECKO_DEMO_API_KEY! },
	})
	await Bun.write(filepath, await img.arrayBuffer())
}

try {
	const coins: Array<{ id: string; symbol: string; name: string }> = await (
		await coingecko.get("coins/list")
	)
		// await coingecko.get("coins/list/new")
		.json()

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

		symbolIdMap[coin.symbol].push({
			id: coin.id,
			alexa: coinData.public_interest_stats.alexa_rank,
			gecko_rank: coinData.coingecko_rank,
			gecko_score: coinData.coingecko_score,
			community_score: coinData.community_score,
			image: {
				thumb:
					coin.id +
					path.extname(
						coinData.image.thumb.startsWith("http")
							? last(new URL(coinData.image.thumb).pathname.split("/"))!
							: coinData.image.thumb
					),
				small:
					coin.id +
					path.extname(
						coinData.image.small.startsWith("http")
							? last(new URL(coinData.image.small).pathname.split("/"))!
							: coinData.image.small
					),
				large:
					coin.id +
					path.extname(
						coinData.image.large.startsWith("http")
							? last(new URL(coinData.image.large).pathname.split("/"))!
							: coinData.image.large
					),
			},
		})

		await Bun.write("data/symbol-id-map.json", JSON.stringify(symbolIdMap, null, 2) + "\n")

		if (coinData.image.large.includes("missing_large")) {
			console.log(`${index + 1}/${length} - ${coin.symbol} (${coin.id}) - Missing large image.`)
			const file = Bun.file("data/missing.png")
			await Bun.write(`data/icons/large/${coin.id}.png`, file)
		} else {
			const fileUrl = new URL(coinData.image.large)
			const fileExt = path.extname(fileUrl.pathname)
			await downloadImage(coinData.image.large, `data/icons/large/${coin.id}${fileExt}`)
		}
	}
} catch (e) {
	console.log(e)
	console.log("Rate limit exceeded probably.")
	process.exit(0)
}
