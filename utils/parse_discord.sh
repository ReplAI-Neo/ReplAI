#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")/.." || exit 1

# Run the discord parser
python utils/discord_parser.py --data-dir data/raw/discord --output data/processed/discord_parsed.json --stats