import got from "got"
import fs from "fs"
import path from "path"
import { exit } from "process"

const downloadImage = async (url: string, filepath: string) => {
	const imgStream = await got.stream(url)
	const fileWriter = fs.createWriteStream(filepath)
	imgStream.pipe(fileWriter)
	return new Promise((resolve, reject) => {
		imgStream.on("error", reject)
		fileWriter.on("finish", resolve)
	})
}

const coingecko = got.extend({
	prefixUrl: "https://api.coingecko.com/api/v3",
	responseType: "json",
})

const coins: Array<{ id: string; symbol: string; name: string }> = await coingecko
	.get("coins/list")
	.json()

try {
	for (const coin of coins) {
		if (
			fs.existsSync(`data/${coin.symbol}.png`) ||
			fs.existsSync(`data/${coin.symbol}.svg`) ||
			fs.existsSync(`data/${coin.symbol}.jpg`)
		) {
			console.log(`${coin.symbol} (${coin.id}) - Skipped. Image exists.`)
			continue
		}

		console.log(`${coin.symbol} (${coin.id}) - Downloading.`)

		const coinData: {
			id: string
			symbol: string
			name: string
			image: { thumb: string; small: string; large: string }
		} = await coingecko.get(`coins/${coin.id}`).json()

		const fileUrl = new URL(coinData.image.large)
		const fileExt = path.extname(fileUrl.pathname)
		await downloadImage(coinData.image.large, `data/${coin.symbol}${fileExt}`)
	}
} catch (e) {
	console.log(e)
	console.log("Rate limit exceeded probably.")
	exit(0)
}
