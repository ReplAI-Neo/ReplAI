import BeeperDesktop from "@beeper/desktop-api";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

// Configuration
const TARGET_PHONE = process.env["TARGET_PHONE"];
const POLL_INTERVAL_MS = 5000; // Check every 5 seconds
const SYSTEM_PROMPT = `You are a friendly AI assistant having a casual conversation over text message. 
Keep responses concise and natural, like you're texting a friend. Use casual language but engaging, 
like a friend would. Also, text in all lowercase, and use texting slang/acronyms (like a younger person would). 
Don't text in large blocks of text.`;

interface Message {
  id: string;
  sortKey: number;
  text?: string;
  senderID?: string;
  senderName?: string;
  isSender: boolean; // true if YOU sent it, false if they sent it
  isUnread?: boolean;
}

interface ConversationState {
  chatId: string;
  lastSeenSortKey: number;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
}

async function findTargetChat(client: BeeperDesktop): Promise<string | null> {
  const chatResults = await client.chats.search({
    query: TARGET_PHONE,
    limit: 10,
    type: "single",
  });

  if (chatResults.items.length === 0) {
    return null;
  }

  return chatResults.items[0].id;
}

async function getNewMessages(
  client: BeeperDesktop,
  chatId: string,
  lastSeenSortKey: number
): Promise<Message[]> {
  const encodedChatId = encodeURIComponent(chatId);
  const response = (await client.get(`/v1/chats/${encodedChatId}/messages`, {
    query: { limit: 50 },
  })) as any;

  const messages = response.items || [];

  // Filter for messages newer than last seen and from target
  const filtered = messages.filter(
    (msg: Message) =>
      msg.sortKey > lastSeenSortKey &&
      msg.isSender === false &&
      msg.text &&
      msg.text.trim().length > 0
  );

  return filtered;
}

async function generateResponse(
  openai: OpenAI,
  conversationHistory: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory,
    ],
    temperature: 0.8,
    max_tokens: 200,
  });

  return completion.choices[0].message.content || "👍";
}

async function sendMessage(
  client: BeeperDesktop,
  chatId: string,
  text: string
): Promise<void> {
  const encodedChatId = encodeURIComponent(chatId);
  await client.post(`/v1/chats/${encodedChatId}/messages`, {
    body: { text },
  });
}

async function runAgent() {
  // Initialize clients
  const beeperToken = process.env["BEEPER_ACCESS_TOKEN"];
  const openaiKey = process.env["OPENAI_API_KEY"];

  if (!beeperToken) {
    console.error("❌ Error: BEEPER_ACCESS_TOKEN not found in .env file");
    process.exit(1);
  }

  if (!openaiKey) {
    console.error("❌ Error: OPENAI_API_KEY not found in .env file");
    process.exit(1);
  }

  const beeper = new BeeperDesktop({ accessToken: beeperToken });
  const openai = new OpenAI({ apiKey: openaiKey });

  console.log("🤖 AI Agent started");
  console.log(`📱 Monitoring: ${TARGET_PHONE}`);
  console.log("Press Ctrl+C to stop\n");

  // Find the target chat
  const chatId = await findTargetChat(beeper);
  if (!chatId) {
    console.error(`❌ Could not find chat with ${TARGET_PHONE}`);
    process.exit(1);
  }
  const encodedChatId = encodeURIComponent(chatId);
  const recentResponse = (await beeper.get(
    `/v1/chats/${encodedChatId}/messages`,
    {
      query: { limit: 5 },
    }
  )) as any;

  const recentMessages = recentResponse.items || [];

  // Find the most recent message from target to know where to start
  const lastTargetMessage = recentMessages.find(
    (msg: any) => msg.isSender === false
  );

  let startingSortKey: number;
  if (lastTargetMessage && lastTargetMessage.isUnread) {
    // Start just before their last unread message to catch it
    startingSortKey = lastTargetMessage.sortKey - 1;
    console.log(`📨 Unread: "${lastTargetMessage.text?.substring(0, 50)}"\n`);
  } else {
    // No unread messages, start from now
    startingSortKey = Date.now() * 1000;
    console.log(`✅ Listening for messages...\n`);
  }

  const state: ConversationState = {
    chatId,
    lastSeenSortKey: startingSortKey,
    conversationHistory: [],
  };

  // Main loop
  while (true) {
    try {
      const newMessages = await getNewMessages(
        beeper,
        state.chatId,
        state.lastSeenSortKey
      );

      if (newMessages.length > 0) {
        // Display received messages
        for (const msg of newMessages) {
          console.log(`📨 Them: ${msg.text}`);

          // Add to conversation history
          state.conversationHistory.push({
            role: "user",
            content: msg.text || "",
          });

          // Keep conversation history manageable (last 10 exchanges)
          if (state.conversationHistory.length > 20) {
            state.conversationHistory = state.conversationHistory.slice(-20);
          }
          state.lastSeenSortKey = Math.max(state.lastSeenSortKey, msg.sortKey);
        }

        // Show conversation context
        console.log(
          `💭 Context: ${state.conversationHistory.length} messages in history`
        );

        // Generate and send response
        const response = await generateResponse(
          openai,
          state.conversationHistory
        );

        // Add to history
        state.conversationHistory.push({
          role: "assistant",
          content: response,
        });

        await sendMessage(beeper, state.chatId, response);
        console.log(`🤖 Agent: ${response}\n`);
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    } catch (error) {
      if (error instanceof BeeperDesktop.APIError) {
        console.error(`❌ Beeper API Error: ${error.message}`);
      } else if (error instanceof Error) {
        console.error(`❌ Error: ${error.message}`);
      } else {
        console.error(`❌ Unknown error:`, error);
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

process.on("SIGINT", () => {
  console.log("\n\n👋 Agent stopping...");
  process.exit(0);
});

runAgent();
