# Telegram Bot Setup & Testing Checklist

## Pre-Setup Checklist

- [ ] Have access to Telegram account
- [ ] Have Telegram installed (mobile or web: web.telegram.org)
- [ ] Project code is ready to use
- [ ] Text editor/IDE to edit .env file

---

## Step 1: Create Telegram Bot (⏱️ ~2 minutes)

### On Telegram

- [ ] Open Telegram app or visit web.telegram.org
- [ ] Search for **@BotFather**
- [ ] Start conversation with BotFather
- [ ] Send command: `/newbot`
- [ ] BotFather asks for bot name → Enter a name (e.g., "MarketBuddy Orders")
- [ ] BotFather asks for username → Enter username (e.g., "marketbuddy_orders_bot")
- [ ] **BotFather provides Bot Token** → Save this securely
  - Format: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`
- [ ] You now have your own bot!

### Verification

- [ ] Search for your new bot by username in Telegram
- [ ] Bot exists and you can see its profile
- [ ] Bot is ready to receive messages

---

## Step 2: Get Your Chat ID (⏱️ ~1 minute)

### Method A: Direct Message (Easiest)

- [ ] Search for your bot in Telegram (by username)
- [ ] Click on bot profile
- [ ] Send a test message (e.g., "test")
- [ ] Open your browser and visit:
  ```
  https://api.telegram.org/bot<REPLACE_WITH_YOUR_BOT_TOKEN>/getUpdates
  ```
  Example:
  ```
  https://api.telegram.org/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/getUpdates
  ```
- [ ] You'll see JSON response with your messages
- [ ] Find the `"chat":{"id":...}` field
- [ ] Copy the number in `id` - this is your **Chat ID**
  - Format: `987654321` (just a number)
- [ ] Save this Chat ID

### Method B: Group (Alternative)

- [ ] Create a Telegram group or use existing one
- [ ] Add your bot to the group
- [ ] Send a message mentioning the bot
- [ ] Follow the getUpdates URL steps above to find Chat ID
- [ ] Note: Group Chat IDs are negative (e.g., `-123456789`)

### Verification

- [ ] You have Bot Token (long string with colon)
- [ ] You have Chat ID (long number, might be negative)
- [ ] Both are saved safely

---

## Step 3: Configure .env File (⏱️ ~30 seconds)

### Edit .env

- [ ] Open `.env` file in project root
- [ ] Locate section:
  ```env
  # Telegram Bot Configuration
  VITE_TELEGRAM_BOT_TOKEN="your_telegram_bot_token_here"
  VITE_TELEGRAM_CHAT_ID="your_telegram_chat_id_here"
  ```
- [ ] Replace `your_telegram_bot_token_here` with your Bot Token
- [ ] Replace `your_telegram_chat_id_here` with your Chat ID
- [ ] **Do NOT include quotes in values** (unless required)
- [ ] Example:
  ```env
  VITE_TELEGRAM_BOT_TOKEN="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
  VITE_TELEGRAM_CHAT_ID="987654321"
  ```
- [ ] Save file (Ctrl+S or Cmd+S)

### Verification

- [ ] .env file saved
- [ ] No syntax errors (no missing quotes, colons, etc.)
- [ ] Both variables are on separate lines
- [ ] Values match exactly what BotFather provided

---

## Step 4: Restart Dev Server (⏱️ ~30 seconds)

### Stop Server

- [ ] Go to terminal running dev server
- [ ] Press `Ctrl+C` to stop (or `Cmd+C` on Mac)
- [ ] Terminal shows server stopped

### Start Server

- [ ] Run: `npm run dev` or `bun run dev`
- [ ] Wait for message "ready in Xs ms"
- [ ] Server is ready
- [ ] Verify no errors in console

### Verification

- [ ] Dev server is running
- [ ] No error messages about .env
- [ ] App is accessible (usually http://localhost:5173)

---

## Step 5: Test Telegram Connection (⏱️ ~1 minute)

### Manual API Test (Optional)

- [ ] Open browser tab
- [ ] Visit: `https://api.telegram.org/bot<TOKEN>/getMe`
- [ ] Should see JSON with your bot info
- [ ] Confirms Bot Token is valid

### Verification

- [ ] Bot API is responsive
- [ ] No "Unauthorized" errors
- [ ] Response shows bot information

---

## Step 6: Test Checkout Flow (⏱️ ~5 minutes)

### Navigate to Checkout

- [ ] Open app in browser (usually http://localhost:5173)
- [ ] Login if required
- [ ] Select a product
- [ ] Click checkout button
- [ ] Verify you're on "Shipping Address" page

### Fill Shipping Form

- [ ] **Full Name**: `John Doe`
- [ ] **Phone Number**: `+1 234 567 8900`
- [ ] **Email**: `john@example.com`
- [ ] **Street Address**: `123 Main Street, Apt 4B`
- [ ] **City**: `New York`
- [ ] **State/Province**: `NY`
- [ ] **Postal Code**: `10001`
- [ ] **Country**: `United States`
- [ ] **Verify all fields are filled**
- [ ] Click **"Continue to Payment"**

### Fill Payment Form

- [ ] Verify "Payment" is now active step
- [ ] **Card Number**: `4111 1111 1111 1111` (Visa test card)
- [ ] **Cardholder Name**: `JOHN DOE`
- [ ] **Expiry Date**: `12/25` (MM/YY format)
- [ ] **CVV**: `123`
- [ ] **Verify amount shown** (should match order total)
- [ ] Click **"Pay $[Amount]"**

### Complete OTP Verification

- [ ] OTP screen appears
- [ ] Shows last 4 digits of card
- [ ] Timer starts (60 seconds)
- [ ] 6 input boxes for OTP code
- [ ] **Enter any 6 digits** (e.g., `123456`)
- [ ] Click **"Verify"** or press Enter
- [ ] Wait for verification to complete

### Check Telegram

- [ ] Open Telegram
- [ ] Go to the chat where you configured bot
- [ ] **Look for new message** with checkout details
- [ ] Message should appear within 5-10 seconds

### Verify Message Content

- [ ] ✅ Message starts with "🛒 NEW CHECKOUT NOTIFICATION"
- [ ] ✅ Order ID section visible
- [ ] ✅ Shipping address includes all fields:
  - [ ] John Doe
  - [ ] john@example.com
  - [ ] +1 234 567 8900
  - [ ] 123 Main Street, Apt 4B
  - [ ] New York, NY 10001
  - [ ] United States
- [ ] ✅ Payment details section visible:
  - [ ] JOHN DOE (cardholder)
  - [ ] Visa (card brand)
  - [ ] ••••••••••••1111 (masked card)
  - [ ] 12/25 (expiry)
- [ ] ✅ Timestamp is current
- [ ] ✅ Message is HTML formatted (bold text, newlines)

### Verification

- [ ] Message received in Telegram
- [ ] All data is correct
- [ ] Format is readable
- [ ] Checkout completed successfully

---

## Step 7: Check Browser Console (⏱️ ~1 minute)

### Open Developer Tools

- [ ] Press `F12` (or `Cmd+Option+I` on Mac)
- [ ] Go to **Console** tab
- [ ] Clear any previous messages

### Look for Success Message

- [ ] After completing checkout, check console
- [ ] Look for: `✅ Checkout data sent to Telegram successfully`
- [ ] Or look for error logs if failure occurred

### Verification

- [ ] Success message logged
- [ ] No JavaScript errors
- [ ] API response logged (if visible)

---

## Troubleshooting Checklist

If message NOT received:

### Check 1: .env Configuration

- [ ] Open `.env` file
- [ ] Verify `VITE_TELEGRAM_BOT_TOKEN` exists
- [ ] Verify `VITE_TELEGRAM_CHAT_ID` exists
- [ ] Check for typos or extra spaces
- [ ] No backticks around values
- [ ] Bot Token starts with numbers + colon
- [ ] Chat ID is all numbers (or minus sign + numbers for groups)
- [ ] **If changed**: Restart dev server
- [ ] **Retest** checkout flow

### Check 2: Telegram Bot Token Validity

- [ ] Visit: `https://api.telegram.org/bot<TOKEN>/getMe`
- [ ] Replace `<TOKEN>` with your actual token
- [ ] Check response:
  - ✅ `"ok": true` → Token is valid
  - ❌ `"ok": false, "error_code": 401` → Token is invalid/revoked
- [ ] If invalid:
  - [ ] Get new token from @BotFather
  - [ ] Update .env
  - [ ] Restart server

### Check 3: Chat ID Validity

- [ ] Visit: `https://api.telegram.org/bot<TOKEN>/getUpdates`
- [ ] Look for recent messages in response
- [ ] Copy correct Chat ID
- [ ] Verify format (number or -number)
- [ ] Update .env if needed
- [ ] Restart server

### Check 4: Bot Permissions

- [ ] Search for bot in Telegram
- [ ] Send test message to bot
- [ ] Verify bot doesn't ignore messages
- [ ] Check bot is not in restricted mode
- [ ] Click bot profile → Settings → Check privacy

### Check 5: Browser Console

- [ ] Open DevTools (F12)
- [ ] Go to Console tab
- [ ] Look for error messages
- [ ] Check Network tab for API calls
- [ ] Look for Telegram API response (should show OK: true)

### Check 6: Internet Connection

- [ ] Verify internet is working
- [ ] Try accessing Google in browser
- [ ] Check if other APIs work (Supabase, etc.)
- [ ] Try sending message directly to bot
- [ ] Retry checkout

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Telegram credentials not configured" | Add both variables to .env and restart server |
| "Bad Request: chat not found" | Chat ID is wrong. Send message to bot, get correct ID |
| "Unauthorized" | Bot Token is invalid. Get new one from @BotFather |
| No message in Telegram after 30 seconds | Check browser console for errors. Check internet |
| Message arrives but data is incomplete | Check shipping form was fully filled. Verify all fields |
| Message has HTML tags visible (like `<b>`) | Issue with Telegram API. Sometimes resolves on refresh |

---

## Advanced Testing (Optional)

### Test with Different Data

- [ ] Run checkout multiple times
- [ ] Use different shipping addresses
- [ ] Use different test card numbers
- [ ] Verify each message appears in Telegram

### Test Error Handling

- [ ] Disconnect internet before "Continue to Verification"
- [ ] Checkout should complete (error non-blocking)
- [ ] Check browser console for error message

### Load Testing (Optional)

- [ ] Complete multiple checkouts quickly
- [ ] Verify all messages arrive
- [ ] No rate limiting issues from Telegram

---

## Success Indicators ✅

You'll know it's working when:

- ✅ .env file has valid credentials
- ✅ Dev server runs without errors
- ✅ Checkout form loads
- ✅ Shipping details input works
- ✅ Payment details input works
- ✅ OTP verification accepts 6 digits
- ✅ Success screen appears after OTP
- ✅ Telegram receives message within 10 seconds
- ✅ Message contains all shipping data
- ✅ Message contains payment brand & last 4 digits
- ✅ Browser console shows "✅ Checkout data sent to Telegram successfully"

---

## Next Steps After Success

- [ ] Test with real checkout flow (not test data)
- [ ] Try different products
- [ ] Try different shipping addresses
- [ ] Monitor Telegram for all messages
- [ ] Set up notification sound on Telegram
- [ ] Archive or organize Telegram messages
- [ ] Consider adding custom Telegram bot commands
- [ ] Document the process for your team

---

## Support Resources

**Quick Help:**
- Bot not responding? → @BotFather
- Getting updates: → https://api.telegram.org/bot<TOKEN>/getUpdates
- API help: → https://core.telegram.org/bots/api

**Documentation Files:**
- Quick Start: `TELEGRAM_QUICK_START.md`
- Setup Guide: `TELEGRAM_SETUP.md`
- Implementation: `IMPLEMENTATION_GUIDE.md`
- Flow Diagram: `FLOW_DIAGRAM.md`

---

## Completion Confirmation

When all checkboxes are complete:

```
✅ Telegram bot created
✅ Chat ID obtained
✅ .env configured
✅ Dev server restarted
✅ Telegram connection tested
✅ Checkout flow tested
✅ Message received in Telegram
✅ Data verified correct
✅ Console confirmed success
✅ Troubleshooting complete (if needed)
```

**You're all set!** 🎉 Your Telegram checkout notification system is live and ready to use.

---

## Questions?

- Refer to the documentation files listed above
- Check Telegram Bot API: https://core.telegram.org/bots/api
- Contact BotFather on Telegram for bot-related issues

