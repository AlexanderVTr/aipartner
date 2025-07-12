# Good vs Bad Code Examples

## 🎯 Token Management

### ✅ GOOD: Simple, direct

```typescript
export async function resetTokensForPlan(
  clerkUserId: string,
  newPlan: 'free' | 'pro' | 'premium',
) {
  const newTokens = TOKENS_PER_PLAN[newPlan]

  const { error } = await supabaseAdmin
    .from('users')
    .update({ tokens_balance: newTokens })
    .eq('clerk_user_id', clerkUserId)

  if (error) throw error
  return newTokens
}
```

### ❌ BAD: Over-engineered

```typescript
export class TokenManager {
  private planStrategies: Map<string, TokenStrategy>

  constructor() {
    this.planStrategies = new Map([
      ['free', new FreeTokenStrategy()],
      ['pro', new ProTokenStrategy()],
      ['premium', new PremiumTokenStrategy()],
    ])
  }

  async resetTokensForPlan(
    userId: string,
    plan: string,
    options?: ResetOptions,
  ) {
    const strategy = this.planStrategies.get(plan)
    if (!strategy) throw new Error('Invalid plan')

    const tokens = await strategy.calculateTokens(options)
    await this.updateUserTokens(userId, tokens, options)

    if (options?.notify) {
      await this.notifyUser(userId, tokens)
    }

    return tokens
  }

  // ... 50 more lines of unnecessary abstraction
}
```

## 🎯 React Context

### ✅ GOOD: Only what's used

```typescript
interface TokensContextType {
  tokens: number
  decrementTokens: () => Promise<void>
}

export function TokensProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState(0)

  const handleDecrementTokens = async () => {
    await decrementTokensDB()
    setTokens((prev) => prev - 1)
  }

  return (
    <TokensContext.Provider value={{ tokens, decrementTokens: handleDecrementTokens }}>
      {children}
    </TokensContext.Provider>
  )
}
```

### ❌ BAD: Unnecessary features

```typescript
interface TokensContextType {
  tokens: number
  decrementTokens: () => Promise<void>
  refreshTokens: () => Promise<void> // Not used anywhere
  incrementTokens: () => Promise<void> // Not needed yet
  resetTokens: () => Promise<void> // Not called
  getTokenHistory: () => Promise<Token[]> // Over-engineering
  subscribeToChanges: (callback: Function) => void // YAGNI
}
```

## 🎯 Webhook Handlers

### ✅ GOOD: Focused on one thing

```typescript
export async function POST(req: NextRequest) {
  const body = await req.text()
  const evt = JSON.parse(body)

  if (evt.type === 'subscription.updated') {
    await handleSubscriptionChange(evt.data.user_id!, evt.data)
  }

  return NextResponse.json({ received: true })
}
```

### ❌ BAD: Handling everything

```typescript
export async function POST(req: NextRequest) {
  const body = await req.text()
  const evt = JSON.parse(body)

  switch (evt.type) {
    case 'subscription.created': // Not needed
    case 'subscription.updated':
    case 'subscription.deleted': // Not needed
      await handleSubscriptionChange(evt.data.user_id!, evt.data)
      break
    case 'user.created': // Not needed
      await handleUserCreated(evt.data)
      break
    case 'user.updated': // Not needed
      await handleUserUpdated(evt.data)
      break
    case 'organization.created': // Not needed
      await handleOrgCreated(evt.data)
      break
    // ... 10 more cases that are never used
  }

  return NextResponse.json({ received: true })
}
```

## 🎯 Component Usage

### ✅ GOOD: Simple, clear

```typescript
export default function Chat() {
  const { tokens, decrementTokens } = useTokens()

  const handleSendMessage = async () => {
    if (tokens === 0) {
      router.push('/pricing')
      return
    }

    // Send message logic
    await decrementTokens()
  }

  return (
    <div>
      {/* Chat UI */}
    </div>
  )
}
```

### ❌ BAD: Using unused features

```typescript
export default function Chat() {
  const {
    tokens,
    decrementTokens,
    refreshTokens, // Not used in this component
    incrementTokens, // Not used in this component
  } = useTokens()

  // ... component logic that only uses tokens and decrementTokens
}
```

## 💡 Key Takeaways

1. **Only create what you use**
2. **Follow existing patterns**
3. **Keep it simple**
4. **Don't future-proof prematurely**
