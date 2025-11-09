#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")/.." || exit 1

# Run the instagram parser
# NOTE: Replace "display_name" with your Instagram display name
python utils/instagram_parser.py data/raw/instagram --user-name display_name -o data/processed/instagram_parsed.json --pretty
