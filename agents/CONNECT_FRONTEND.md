# Connecting Your Frontend to the Deployed Agent

Guide on how to connect your Next.js application to the agent deployed on LiveKit Cloud.

## 🎯 How It Works

When you deploy an agent to LiveKit Cloud, it **automatically listens** for new rooms in your LiveKit Cloud project. Your frontend just needs to:

1. ✅ Use the same LiveKit Cloud project URL
2. ✅ Create rooms in that project
3. ✅ The agent will automatically join when users connect

**No additional configuration needed!** The agent auto-joins rooms in your project.

## ✅ Verification Checklist

### 1. Verify LiveKit Cloud Project URL

Your frontend should use your LiveKit Cloud project URL. Check your `.env` file:

```bash
NEXT_PUBLIC_LIVEKIT_URL=wss://aisha-966mjgrn.livekit.cloud
```

**Where to find your project URL:**

1. Go to [cloud.livekit.io](https://cloud.livekit.io)
2. Select your project (aisha)
3. Go to Settings → Keys
4. Copy the "Project URL" (starts with `wss://`)

### 2. Verify Agent is Deployed

Check that your agent is running:

```bash
lk agent status
```

You should see status: `Running` or `Sleeping` (sleeping is fine, it will wake up when needed).

### 3. Verify Agent is in Same Project

The agent must be deployed to the same LiveKit Cloud project as your frontend.

Check your `livekit.toml`:

```toml
[project]
subdomain = "aisha-966mjgrn"  # Must match your project
```

## 🔄 How the Connection Works

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │────────▶│ LiveKit Cloud│◀────────│   Agent     │
│  (Next.js)  │         │   Project    │         │ (Deployed)  │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                        │
      │ 1. Create Room         │                        │
      ├───────────────────────▶│                        │
      │                        │                        │
      │ 2. Connect to Room     │                        │
      ├───────────────────────▶│                        │
      │                        │                        │
      │                        │ 3. Agent Auto-Joins    │
      │                        │◀───────────────────────┤
      │                        │                        │
      │ 4. Video/Audio Stream  │                        │
      │◀───────────────────────┼───────────────────────▶│
      │                        │                        │
```

### Step-by-Step Flow:

1. **Frontend creates room** → Calls `/api/hedra/room` which creates a LiveKit room
2. **Frontend connects** → User joins the room via LiveKit client
3. **Agent auto-joins** → Deployed agent automatically detects the new participant and joins
4. **Conversation starts** → Agent initializes Hedra avatar and starts listening

## 🚀 Quick Setup

### Option 1: Already Configured (Most Likely)

If your `.env` already has:

```bash
NEXT_PUBLIC_LIVEKIT_URL=wss://aisha-966mjgrn.livekit.cloud
LIVEKIT_API_KEY=your-key
LIVEKIT_API_SECRET=your-secret
```

**You're done!** The frontend will automatically use the deployed agent when:

- ✅ Agent is deployed to the same project
- ✅ Frontend uses the same LiveKit Cloud URL
- ✅ Agent status is `Running` or `Sleeping`

### Option 2: Update Environment Variables

If you need to update your LiveKit Cloud URL:

1. **Get your project URL from LiveKit Cloud dashboard:**
   - Go to [cloud.livekit.io](https://cloud.livekit.io)
   - Select your project
   - Settings → Keys
   - Copy "Project URL"

2. **Update `.env` file:**

   ```bash
   NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=your-api-key
   LIVEKIT_API_SECRET=your-api-secret
   ```

3. **Update Vercel environment variables** (if deployed):
   - Go to Vercel dashboard
   - Project → Settings → Environment Variables
   - Update the values

4. **Redeploy frontend** (if needed):
   ```bash
   # Vercel will auto-deploy on git push, or:
   vercel --prod
   ```

## 🧪 Testing the Connection

### 1. Check Agent Status

```bash
lk agent status
```

Expected output:

```
Status: Running (or Sleeping)
```

### 2. Check Agent Logs

```bash
lk agent logs --follow
```

### 3. Test Frontend Connection

1. Open your Next.js app
2. Click the Hedra video call button
3. Check browser console for connection logs
4. Check agent logs: `lk agent logs --follow`

You should see:

- **Frontend logs:** "Connected to Hedra room"
- **Agent logs:** "Starting Hedra avatar session for room: ..."

## 🔍 Troubleshooting

### Agent Not Joining Rooms

**Problem:** Agent doesn't join when frontend creates a room.

**Solutions:**

1. Verify agent is deployed to same project:

   ```bash
   lk agent status
   # Check project matches
   ```

2. Check agent logs for errors:

   ```bash
   lk agent logs
   ```

3. Verify LiveKit URL matches:
   - Frontend `.env`: `NEXT_PUBLIC_LIVEKIT_URL=wss://aisha-966mjgrn.livekit.cloud`
   - Agent project: `aisha-966mjgrn` (in `livekit.toml`)

### "Agent not responding"

**Problem:** Agent joins but doesn't respond to voice.

**Solutions:**

1. Check agent secrets are set:

   ```bash
   lk agent secrets
   ```

2. Verify all required secrets:
   - `HEDRA_API_KEY`
   - `DEEPGRAM_API_KEY`
   - `CARTESIA_API_KEY`
   - `OPENAI_API_KEY` or `OPENROUTER_API_KEY`

3. Check agent logs for initialization errors:
   ```bash
   lk agent logs
   ```

### Frontend Can't Connect

**Problem:** Frontend can't connect to LiveKit room.

**Solutions:**

1. Verify `NEXT_PUBLIC_LIVEKIT_URL` is correct
2. Check `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are set
3. Verify room creation API works: `/api/hedra/room`
4. Check browser console for errors

## 📋 Summary

**To connect your frontend to the deployed agent:**

1. ✅ Deploy agent: `lk agent create agents/`
2. ✅ Verify agent status: `lk agent status` (should be Running/Sleeping)
3. ✅ Ensure frontend uses same LiveKit Cloud URL in `.env`
4. ✅ That's it! Agent auto-joins rooms automatically

**No code changes needed!** The agent automatically listens for rooms in your LiveKit Cloud project.

## 🎯 Quick Verification Command

Run this to verify everything is connected:

```bash
# 1. Check agent is running
lk agent status

# 2. Check agent is in correct project
cat livekit.toml | grep subdomain

# 3. Check frontend URL matches
grep NEXT_PUBLIC_LIVEKIT_URL .env
```

All three should reference the same project (e.g., `aisha-966mjgrn`).
