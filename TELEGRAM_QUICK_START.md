# Quick Start - Telegram Bot Setup

## TL;DR - 3 Step Setup

### Step 1: Create Bot (2 minutes)
1. Message **@BotFather** on Telegram
2. Send `/newbot`
3. Follow prompts and receive your **BOT_TOKEN**

### Step 2: Get Chat ID (1 minute)
1. Send any message to your new bot
2. Visit: `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
3. Copy your **CHAT_ID** from the response

### Step 3: Configure .env (30 seconds)
Edit `.env`:
```env
VITE_TELEGRAM_BOT_TOKEN="your_bot_token"
VITE_TELEGRAM_CHAT_ID="your_chat_id"
```

**Done!** ✅ Notifications will now be sent to your Telegram when users complete checkout.

---

## What Gets Sent?

When a user finishes entering shipping and payment details, then clicks "Continue to Verification" → OTP verification → Success, a Telegram message is sent with:

- 📋 Order ID, Product, Quantity, Amount
- 📍 Full Shipping Address (Name, Email, Phone, Address)
- 💳 Payment Info (Cardholder, Card Type, Last 4 Digits, Expiry)
- ⏰ Timestamp

## Testing It

1. Go to checkout
2. Fill shipping form → "Continue to Payment"
3. Fill payment form → "Continue to Verification"
4. Enter any 6 digits for OTP
5. **Check Telegram** - you should receive the notification!

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No message received | Verify .env has correct token/chat ID. Restart dev server. |
| "Bot token invalid" | Copy directly from BotFather, no extra spaces |
| "Chat not found" | Send a message to bot first, then try again |
| Not seeing Chat ID in getUpdates | Make sure you sent a message to the bot recently |

See `TELEGRAM_SETUP.md` for detailed setup instructions.
