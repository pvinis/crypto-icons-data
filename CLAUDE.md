# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a cryptocurrency icon data collection tool that fetches cryptocurrency icons from the CoinGecko API and stores them locally.

## Common Development Commands

```bash
# Run the main script to fetch icons
bun do-it

# Install dependencies
bun install
```

## Environment Variables

The following environment variables need to be set:

- `COINGECKO_PRO_API_KEY` - Required when `pro` is set to true (line 5 in main.ts)
- `COINGECKO_DEMO_API_KEY` - Required when `pro` is set to false

## Project Architecture

### Main Components

1. **Data Fetching** (`src/main.ts`):
   - Fetches cryptocurrency list from CoinGecko API
   - Downloads icon images (thumb, small, large sizes)
   - Maintains a symbol-to-ID mapping with metadata

### Data Structure

- `data/data.json` - Full list of coins from CoinGecko
- `data/symbol-id-map.json` - Maps cryptocurrency symbols to IDs with metadata including:
  - Alexa rank
  - CoinGecko rank and scores
  - Image URLs for different sizes
- `data/icons/large/` - Directory containing downloaded large icon images
- `data/missing.png` - Placeholder image for missing icons

### API Integration

The project uses CoinGecko API v3 with support for both:

- Pro API: `https://pro-api.coingecko.com/api/v3/`
- Demo API: `https://api.coingecko.com/api/v3/`

Key endpoints used:

- `/coins/list` - Get list of all coins
- `/coins/{id}` - Get detailed coin data including image URLs

### Important Notes

1. **Rate Limiting**: The script handles rate limit errors gracefully and exits when limit is exceeded
2. **Icon Storage**: Icons are saved with the coin ID as filename and appropriate extension
3. **Missing Icons**: When a coin has no large icon, a placeholder (`missing.png`) is copied instead
4. **Deduplication**: The script checks if an icon already exists before downloading to avoid duplicates
