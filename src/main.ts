import path from "path"
import { last } from "lodash"
import symbolIdMapJson from "../data/symbol-id-map.json"
import { CoinDetailSchema, CoinsListSchema } from "./types"

const pro = false

const symbolIdMap: Record<
	string,
	Array<{
		id: string
		image: {
			thumb: string
			small: string
			large: string
		}
	}>
> = symbolIdMapJson

const coingecko = {
	get: async (url: string) => {
		const apiUrl = pro ? "https://pro-api.coingecko.com/api/v3/" : "https://api.coingecko.com/api/v3/"
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

const apiPath = "coins/list"
// const apiPath = "coins/list/new"

try {
	// sanity check: ping the api first
	const pingResponse = await coingecko.get("ping")
	if (!pingResponse.ok) {
		console.log(`API ping failed: ${pingResponse.status} ${pingResponse.statusText}`)
		throw new Error("Failed to connect to CoinGecko API")
	}
	const pingData = await pingResponse.json()
	console.log("API ping successful:", pingData)

	const coinsResponse = await coingecko.get(apiPath)
	if (!coinsResponse.ok) {
		console.debug(`API error fetching coins list: ${coinsResponse.status} ${coinsResponse.statusText}`)
		throw new Error(`Failed to fetch coins list`)
	}
	const coins = CoinsListSchema.parse(await coinsResponse.json())

	await Bun.write("data/data.json", JSON.stringify(coins, null, 2) + "\n")

	const length = coins.length
	console.log("length:", length)

	for (const [index, coin] of coins.entries()) {
		const ids = symbolIdMap[coin.symbol]
		if (ids !== undefined && ids.some((item) => item.id === coin.id)) {
			// console.debug(`${index + 1}/${length} - ${coin.symbol} (${coin.id}) - Skipped. Already exists.`)
			continue
		}

		if (ids === undefined) {
			symbolIdMap[coin.symbol] = []
		}

		// console.debug(`${index + 1}/${length} - ${coin.symbol} (${coin.id}) - Fetching..`)
		const coinDetailResponse = await coingecko.get(`coins/${coin.id}`)
		if (!coinDetailResponse.ok) {
			console.debug(`API error fetching ${coin.id}: ${coinDetailResponse.status} ${coinDetailResponse.statusText}`)
			if (coinDetailResponse.status === 429) {
				throw new Error("Rate limit exceeded")
			}
			console.debug(`Skipping ${coin.symbol} (${coin.id})...`)
			continue
		}
		const coinData = CoinDetailSchema.parse(await coinDetailResponse.json())

		symbolIdMap[coin.symbol]!.push({
			id: coin.id,
			image: {
				thumb:
					coin.id +
					path.extname(
						coinData.image.thumb.startsWith("http")
							? last(new URL(coinData.image.thumb).pathname.split("/"))!
							: coinData.image.thumb,
					),
				small:
					coin.id +
					path.extname(
						coinData.image.small.startsWith("http")
							? last(new URL(coinData.image.small).pathname.split("/"))!
							: coinData.image.small,
					),
				large:
					coin.id +
					path.extname(
						coinData.image.large.startsWith("http")
							? last(new URL(coinData.image.large).pathname.split("/"))!
							: coinData.image.large,
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
