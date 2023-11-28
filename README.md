also, i found that coingecko has a pretty good collection of icons, and they have an api https://www.coingecko.com/api/documentation

that api has two nice calls, one is the list of all coins, with a HUGE list, of coingecko ids plus the symbol, and then another call for a specific id that returns three links to icons, a thumb, a small and a large.

looking at the prices, feels like we could just grab all the icons from there. pay once to download them all, and then just "cache" them, basically store them to s3 or whatever else we want

and every now and then, we can run the list call and grab the new icons

same for exchanges!
