# Message Parsers for AI Training

Convert your Instagram, iMessage, and Discord data into a standardized universal schema for training a model to talk like you. Includes **AES-256 selective encryption** for secure data storage and uploading to training platforms like Hugging Face.

## Features

### Instagram Parser

- Parses Instagram's exported message.json files
- Handles Unicode encoding issues in Instagram exports
- Converts to universal conversation schema (OpenAI chat format)
- Supports both individual and group conversations
- Filters out non-content messages (like "Liked a message")
- Chronological message ordering
- Time-based filtering (train on specific date ranges)

### iMessage Parser

- Parses iMessage HTML exports (from imessage-exporter)
- Supports both individual and group conversations
- Processes both single files and entire directories
- Outputs universal conversation schema

### Discord Parser

- Parses Discord exported message data
- Supports both DMs and group conversations
- Outputs universal conversation schema

### Encryption Tool

- **Selective field encryption** - encrypts only sensitive message content
- Leaves metadata unencrypted for analysis (timestamps, participant counts, etc.)
- AES-256 encryption with Fernet
- Supports both encryption and decryption
- Compatible with all parser outputs

## Installation

```bash
pip install -r requirements.txt
```

Or install the required encryption library directly:

```bash
pip install cryptography
```

## Quick Start

### 1. Parse Your Messages

**Instagram:**

```bash
python3 utils/instagram_parser.py data/raw/instagram \
  --user-name "Your Display Name" \
  -o data/processed/instagram_parsed.json \
  --pretty
```

**iMessage:**

```bash
# First, export your messages (macOS only)
brew install imessage-exporter
imessage-exporter -f html -o ~/Desktop/imessage

# Then parse
python3 utils/imessage_parser.py ~/Desktop/imessage \
  -o data/processed/imessage_parsed.json \
  --pretty
```

**Discord:**

```bash
python3 utils/discord_parser.py \
  --data-dir data/raw/discord \
  --output data/processed/discord_parsed.json \
  --stats
```

### 2. (Optional) Encrypt Your Data

For secure upload to training platforms:

```bash
# Generate an encryption key
python3 utils/encrypt_conversations.py --generate-key

# Encrypt your parsed data
python3 utils/encrypt_conversations.py \
  --encrypt data/processed/instagram_parsed.json \
  -o data/processed/instagram_encrypted.json \
  --encryption-key "YOUR_KEY_HERE"
```

**⚠️ IMPORTANT: Save the encryption key! You'll need it to decrypt your data.**

### 3. Use Your Data

The parsed output is now ready for training! Each file follows the universal conversation schema with OpenAI-compatible messages.

## Usage

### Instagram Parser

#### Command Line Options

```bash
python3 utils/instagram_parser.py <input_dir> --user-name <name> -o <output> [options]
```

**Required Arguments:**

- `input_dir` - Root directory containing your Instagram message folders
- `--user-name NAME` - Your display name as it appears in Instagram messages (case-insensitive)
- `-o, --output FILE` - Output JSON file path

**Optional Arguments:**

- `--start-time DATE` - Only include messages from this date onward (ISO format or unix timestamp)
- `--end-time DATE` - Only include messages up to this date (ISO format or unix timestamp)
- `--pretty` - Pretty print JSON output with indentation

**Date Format Examples:**

- ISO date: `2024-01-01` or `2024-01-01T10:30:00`
- Unix timestamp (seconds): `1704067200`
- Unix timestamp (milliseconds): `1704067200000`

#### Examples

**Basic parsing:**

```bash
python3 utils/instagram_parser.py data/raw/instagram \
  --user-name "John Doe" \
  -o data/processed/instagram.json
```

**Filter by date range:**

```bash
python3 utils/instagram_parser.py data/raw/instagram \
  --user-name "John Doe" \
  -o data/processed/instagram_2024.json \
  --start-time "2024-01-01" \
  --end-time "2024-12-31"
```

**Pretty print for readability:**

```bash
python3 utils/instagram_parser.py data/raw/instagram \
  --user-name "John Doe" \
  -o data/processed/instagram.json \
  --pretty
```

**Train on recent conversations only:**

```bash
python3 utils/instagram_parser.py data/raw/instagram \
  --user-name "John Doe" \
  -o data/processed/instagram_recent.json \
  --start-time "2023-01-01"
```

---

### iMessage Parser

#### Command Line Options

```bash
python3 utils/imessage_parser.py <input_path> -o <output> [options]
```

**Required Arguments:**

- `input_path` - Path to HTML file or directory containing iMessage HTML exports
- `-o, --output FILE` - Output JSON file path

**Optional Arguments:**

- `--pretty` - Pretty print JSON output with indentation

#### Examples

**Parse a single conversation:**

```bash
python3 utils/imessage_parser.py ~/Desktop/imessage/+12345678900.html \
  -o data/processed/conversation.json
```

**Parse an entire directory:**

```bash
python3 utils/imessage_parser.py ~/Desktop/imessage \
  -o data/processed/imessage_all.json \
  --pretty
```

**Pretty print for readability:**

```bash
python3 utils/imessage_parser.py ~/Desktop/imessage/+12345678900.html \
  -o data/processed/conversation.json \
  --pretty
```

#### Output Format

See the [Universal Schema](#output-format) section below for the complete output format.

---

## How to Get Your Instagram Data

To download your Instagram data from Meta Accounts Center:

1. **Open Instagram** and go to your profile by tapping your profile picture in the bottom right corner
2. **Access the menu** by tapping the three horizontal lines (hamburger menu) in the top right corner
3. **Navigate to Accounts Center** by tapping "Accounts Center"
4. **Go to your information and permissions** and select "Download your information"
5. **Initiate the export** by tapping "Download or transfer information"
6. **Select your profile** and tap "Next"
7. **Choose what to download** - You can download "All available information" or select specific types
8. **Choose a destination** - Select "Export to device" and tap "Next"
9. **Select your file options:**
   - **Format:** Choose **JSON** (for use with this script)
   - **Date range:** Select the time period you want to download
   - **Media quality:** Adjust the quality for photos and videos
10. **Submit your request** by tapping "Create files" or "Start export"
11. **Wait for the download** - You'll be notified via email when it's ready (can take a few hours to days)
12. **Extract the zip file** and navigate to the `/your_instagram_activity/messages/inbox` subfolder

## How to Get Your iMessage Data

To export your iMessages to HTML format:

### Prerequisites

- **macOS only** - iMessage exporter requires macOS with iMessage enabled
- **Homebrew** - Package manager for macOS ([install here](https://brew.sh))

### Export Steps

1. **Install imessage-exporter:**

```bash
brew install imessage-exporter
```

2. **Export your messages:**

```bash
imessage-exporter -f html -o ~/Desktop/imessage
```

This will create HTML files in `~/Desktop/imessage/` with filenames like:

- Individual chats: `+12345678900.html`
- Group chats: `+12345678900, +10987654321, +11122233344.html`

3. **Grant permissions if needed:**

If prompted, you may need to grant Terminal or imessage-exporter access to your Messages database in System Settings → Privacy & Security → Full Disk Access.

### Export Options

```bash
# Export specific conversation by phone number or email
imessage-exporter -f html -o ~/Desktop/imessage --filter "+12345678900"

# Export within date range
imessage-exporter -f html -o ~/Desktop/imessage --after "2023-01-01" --before "2024-01-01"

# See all options
imessage-exporter --help
```

## Output Format

All parsers output a **universal conversation schema** - a standardized JSON format compatible across Instagram, iMessage, and Discord sources.

### Universal Schema Structure

The output is a JSON array where each element represents one conversation:

```json
[
  {
    "openai_messages": [
      {
        "role": "user",
        "content": "Hey, how's it going?"
      },
      {
        "role": "assistant",
        "content": "Good! What are you up to?"
      }
    ],
    "full_metadata_messages": [
      {
        "message_id": "123",
        "timestamp": "2024-01-01T10:00:00.000+00:00",
        "content": "Hey, how's it going?",
        "author": "Friend"
      },
      {
        "message_id": "124",
        "timestamp": "2024-01-01T10:00:05.000+00:00",
        "content": "Good! What are you up to?",
        "author": "You"
      }
    ],
    "first_message_timestamp": "2024-01-01T10:00:00.000+00:00",
    "last_message_timestamp": "2024-01-01T10:00:05.000+00:00",
    "recipients": ["Friend"],
    "num_participants": 2,
    "total_messages": 2,
    "source": "instagram",
    "chat_type": "direct"
  }
]
```

### Field Descriptions

**OpenAI-Compatible Messages:**

- `openai_messages` - Simplified format ready for training, containing only `role` and `content`

**Full Metadata:**

- `full_metadata_messages` - Complete message data with all metadata preserved (IDs, timestamps, authors)

**Conversation Metadata:**

- `first_message_timestamp` / `last_message_timestamp` - ISO 8601 format timestamps
- `recipients` - List of participant names (excluding yourself)
- `num_participants` - Total unique participants including yourself
- `total_messages` - Total message count in this conversation
- `source` - Where the data came from: `"instagram"`, `"imessage"`, or `"discord"`
- `chat_type` - Either `"direct"` (1-on-1) or `"group"` (3+ people)

**Role Assignment for Training:**

- `assistant` - **Your messages** - what the model learns to imitate
- `user` - **Everyone else's messages** - the prompts/context the model responds to

This role assignment trains a model to talk like you. Your messages become the "assistant" responses that the model learns to generate.

---

## 🔐 Encryption Guide

### Why Encrypt?

When training models on platforms like Hugging Face, your data files may be:

- Stored on remote servers
- Potentially accessible by platform administrators
- Subject to data breaches

Encryption ensures your personal conversations remain private, even if the encrypted files are leaked.

### Selective Encryption

Our encryption tool uses **selective field encryption** - it encrypts only the sensitive message content while leaving metadata unencrypted. This allows you to:

- ✅ Analyze conversation statistics without decryption
- ✅ View timestamps, participant counts, and source information
- ✅ Keep actual message content completely private
- ✅ Train models securely on encrypted platforms

**What Gets Encrypted:**

- `openai_messages` - The training-ready message format
- `full_metadata_messages` - Complete message data with metadata

**What Stays Unencrypted:**

- `first_message_timestamp` / `last_message_timestamp`
- `recipients`, `num_participants`, `total_messages`
- `source`, `chat_type`

### Encryption Technology

Uses **Fernet** (symmetric encryption) which provides:

- AES-256 encryption
- Built-in authentication (prevents tampering)
- Simple key management

### Encryption Workflow

#### Step 1: Parse Your Messages

First, parse your data (encryption is a separate step):

```bash
python3 utils/instagram_parser.py data/raw/instagram \
  --user-name "Your Name" \
  -o data/processed/instagram.json
```

#### Step 2: Generate an Encryption Key

```bash
python3 utils/encrypt_conversations.py --generate-key
```

Outputs:

```
Generated encryption key (save this securely!):
xMzE5NjQ3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MA==
```

**Save this key in a password manager!**

#### Step 3: Encrypt Your Parsed Data

With your generated key:

```bash
python3 utils/encrypt_conversations.py \
  --encrypt data/processed/instagram.json \
  -o data/processed/instagram_encrypted.json \
  --encryption-key "YOUR_KEY_HERE"
```

Or let it auto-generate a key:

```bash
python3 utils/encrypt_conversations.py \
  --encrypt data/processed/instagram.json \
  -o data/processed/instagram_encrypted.json
```

The tool will display the generated key - **save it securely!**

#### Step 4: Upload to Hugging Face

Your encrypted files are now safe to upload! Even if someone accesses them, they can't read the message content without your key.

**Example encrypted file structure:**

```json
[
  {
    "first_message_timestamp": "2024-01-01T10:00:00.000+00:00",
    "recipients": ["Friend"],
    "num_participants": 2,
    "total_messages": 50,
    "source": "instagram",
    "chat_type": "direct",
    "openai_messages_encrypted": "gAAAAABp...(encrypted data)...",
    "full_metadata_messages_encrypted": "gAAAAABp...(encrypted data)...",
    "_encrypted": true
  }
]
```

#### Step 5: Decrypt for Training

On your training platform or locally:

```bash
python3 utils/encrypt_conversations.py \
  --decrypt data/processed/instagram_encrypted.json \
  -o data/processed/instagram_decrypted.json \
  --encryption-key "YOUR_KEY_HERE"
```

Or programmatically in Python:

```python
from cryptography.fernet import Fernet
import json

# Load encrypted file
with open('instagram_encrypted.json') as f:
    data = json.load(f)

# Decrypt message fields
cipher = Fernet(b'YOUR_KEY_HERE')

for conversation in data:
    if conversation.get('_encrypted'):
        # Decrypt OpenAI messages
        encrypted = conversation['openai_messages_encrypted'].encode()
        decrypted = cipher.decrypt(encrypted)
        conversation['openai_messages'] = json.loads(decrypted)

        # Decrypt full metadata
        encrypted = conversation['full_metadata_messages_encrypted'].encode()
        decrypted = cipher.decrypt(encrypted)
        conversation['full_metadata_messages'] = json.loads(decrypted)

# Now use data['openai_messages'] for training
```

### Security Best Practices

#### ✅ DO:

- **Save your encryption key in a password manager** (1Password, Bitwarden, LastPass)
- Store the key separately from the encrypted files
- Use environment variables when deploying to training platforms
- Generate a new key for each dataset
- Keep encrypted backups

#### ❌ DON'T:

- Commit encryption keys to Git repositories
- Store keys in the same location as encrypted files
- Share keys over insecure channels (email, Slack, etc.)
- Use the same key for multiple datasets
- Store keys in plain text files

### Key Storage Recommendations

**Option 1: Password Manager (Recommended)**

Store in 1Password, Bitwarden, or LastPass with a note like:

```
Instagram Messages Encryption Key - Generated 2025-01-08
xMzE5NjQ3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MA==
```

**Option 2: Environment Variable**

```bash
# In your ~/.zshrc or ~/.bashrc
export ENCRYPTION_KEY="xMzE5NjQ3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MA=="
```

Then use:

```bash
python3 utils/encrypt_conversations.py \
  --encrypt data/processed/parsed.json \
  -o data/processed/encrypted.json \
  --encryption-key "$ENCRYPTION_KEY"
```

**Option 3: Encrypted Notes**

Store in Apple Notes (with encryption), Notion, or any encrypted note-taking app.

---

## Time Filtering

Filter messages by date to train on specific time periods (Instagram parser only):

### Supported Date Formats

- **ISO Date**: `"2024-01-15"` or `"2024-01-15T10:30:00"`
- **Unix timestamp (seconds)**: `"1705334400"`
- **Unix timestamp (milliseconds)**: `"1705334400000"`

### Use Cases

```bash
# Only recent conversations (last year)
python3 utils/instagram_parser.py data/raw/instagram \
  --user-name "You" \
  -o data/processed/instagram_2024.json \
  --start-time "2024-01-01"

# Specific time period (college years)
python3 utils/instagram_parser.py data/raw/instagram \
  --user-name "You" \
  -o data/processed/instagram_college.json \
  --start-time "2019-09-01" \
  --end-time "2023-05-31"

# Everything up to a certain date
python3 utils/instagram_parser.py data/raw/instagram \
  --user-name "You" \
  -o data/processed/instagram_old.json \
  --end-time "2022-12-31"
```

**Note:** All dates are interpreted as UTC (to match Instagram's timestamp format). Filters are inclusive.

---

## Features Explained

### Unicode Encoding Fix

Instagram exports have encoding issues where UTF-8 characters (emojis, special characters) are double-encoded. The script automatically fixes this.

### Message Filtering

Automatically skips:

- Messages without content
- Generic messages like "Liked a message"
- Empty messages
- Reactions without text

### What Gets Included

- ✅ Actual text messages with proper emoji support
- ✅ Messages with links
- ✅ All chronologically ordered conversations

---

## Troubleshooting

### "No message.json files found"

- Make sure you're pointing to the correct directory (usually `instagram-data/messages/inbox/`)
- Check that the Instagram export is in JSON format (not HTML)
- Files should be named `message.json` (sometimes `message_1.json`, `message_2.json`, etc.)

### Missing required argument

- The `--user-name` argument is required - you must specify your Instagram display name
- Use the exact name as it appears in your Instagram messages
- Names are case-insensitive

### Encoding issues with emojis

- The script should handle this automatically
- If you still see issues, check that your terminal supports UTF-8
- Check the JSON file directly in a text editor

### "cryptography library is required"

Install it:

```bash
pip install cryptography
```

### "Decryption failed. Invalid key"

- Double-check you're using the exact key (no extra spaces/characters)
- Make sure you're using the key that was generated/used during encryption
- Verify the file hasn't been corrupted

### "Invalid encryption key format"

- Ensure the key is base64-encoded
- The key should be exactly 44 characters long (ending in ==)
- Don't modify the key in any way

---

## Complete End-to-End Example

```bash
# 1. Parse your Instagram messages
python3 utils/instagram_parser.py data/raw/instagram \
  --user-name "krish" \
  -o data/processed/instagram_2023.json \
  --start-time "2023-01-01" \
  --pretty

# 2. Generate an encryption key
python3 utils/encrypt_conversations.py --generate-key
# Save the key displayed!

# 3. Encrypt your parsed data
python3 utils/encrypt_conversations.py \
  --encrypt data/processed/instagram_2023.json \
  -o data/processed/instagram_2023_encrypted.json \
  --encryption-key "YOUR_KEY_HERE"

# 4. Upload encrypted file to Hugging Face
# data/processed/instagram_2023_encrypted.json is now safe to upload!
# Metadata is readable, but message content is encrypted

# 5. In your training script on Hugging Face:
# Decrypt programmatically using the key (see Python example above)

# 6. Later: decrypt locally if needed
python3 utils/encrypt_conversations.py \
  --decrypt data/processed/instagram_2023_encrypted.json \
  -o data/processed/instagram_2023_decrypted.json \
  --encryption-key "YOUR_KEY_HERE"
```

---

## Tips

1. **Parse first, encrypt later** - Keep separate parsing and encryption steps for flexibility
2. **Use time filters** (Instagram) to focus on specific eras of your communication style
3. **Always encrypt** when uploading to training platforms like Hugging Face
4. **Save encryption keys securely** - use a password manager (1Password, Bitwarden, etc.)
5. **Use `--pretty` flag** when parsing to make output files human-readable
6. **Check encoding** - Emojis should appear correctly (😍, 🎉, ❤️)
7. **Verify output** before using for training/analysis
8. **Privacy first** - Remember to review and redact any sensitive information
9. **Metadata stays readable** - You can analyze conversation stats without decrypting

---

## Technical Details

- **Encryption Algorithm**: Fernet (AES-128-CBC with HMAC-SHA256)
- **Key Size**: 256 bits (32 bytes)
- **Key Format**: Base64 URL-safe encoding
- **Authentication**: Built-in (prevents tampering)
- **Standard Library**: Uses Python's built-in JSON, datetime modules
- **External Dependency**: cryptography library for encryption
