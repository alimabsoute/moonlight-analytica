import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  User,
  CreditCard,
  Plug,
  Key,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Check,
  ExternalLink,
  BarChart3,
  Search,
  MessageSquare,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Avatar } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/auth'
import { PRICING_TIERS, createCheckoutSession, createPortalSession } from '@/lib/stripe'
import type { PricingTier } from '@/lib/stripe'
import {
  fetchIntegrations,
  saveSlackWebhook,
  disconnectIntegration,
  fetchApiKeys,
  createApiKey,
  deleteApiKey,
} from '@/lib/supabase'
import { usePlan } from '@/hooks/usePlan'
import { PlanGate } from '@/components/ui/plan-gate'
import { toast } from '@/components/ui/toast'

interface IntegrationDef {
  id: string
  name: string
  description: string
  icon: typeof Search
  color: string
}

const INTEGRATIONS: IntegrationDef[] = [
  {
    id: 'gsc',
    name: 'Google Search Console',
    description: 'Import real keyword data, clicks, impressions, and crawl stats',
    icon: Search,
    color: 'text-[#4285f4]',
  },
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    description: 'Connect traffic data, user behavior, and conversion tracking',
    icon: BarChart3,
    color: 'text-[#f59e0b]',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Receive SEO alerts, rank changes, and audit notifications in Slack',
    icon: MessageSquare,
    color: 'text-[#e01e5a]',
  },
]

function PlanCard({
  tier,
  isCurrentPlan,
  onUpgrade,
}: {
  tier: PricingTier
  isCurrentPlan: boolean
  onUpgrade: (priceId: string) => void
}) {
  return (
    <Card className={isCurrentPlan ? 'border-primary/30 bg-primary/[0.02]' : ''}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">{tier.name}</h3>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-bold text-foreground">${tier.price}</span>
              {tier.price > 0 && <span className="text-sm text-muted-foreground">/mo</span>}
            </div>
          </div>
          {isCurrentPlan && (
            <Badge variant="default">Current Plan</Badge>
          )}
        </div>

        <ul className="space-y-2 mb-5">
          {tier.features.slice(0, 5).map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 mt-0.5 text-success shrink-0" />
              {feature}
            </li>
          ))}
          {tier.features.length > 5 && (
            <li className="text-xs text-primary font-medium">
              +{tier.features.length - 5} more features
            </li>
          )}
        </ul>

        {isCurrentPlan ? (
          <Button variant="outline" className="w-full" disabled>
            Current Plan
          </Button>
        ) : (
          <Button
            variant={tier.id === 'pro' ? 'default' : 'outline'}
            className="w-full"
            onClick={() => tier.priceId && onUpgrade(tier.priceId)}
            disabled={!tier.priceId}
          >
            {tier.price === 0 ? 'Downgrade' : 'Upgrade'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const [name, setName] = useState(user?.fullName ?? 'Alex Chen')
  const [email, setEmail] = useState(user?.email ?? 'alex@seohub.io')
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState<string | null>(null)

  // Integration state
  const [oauthMessage, setOauthMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [slackUrl, setSlackUrl] = useState('')
  const [slackStatus, setSlackStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [slackSaving, setSlackSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  // Billing state
  const [billingSuccess, setBillingSuccess] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)

  // API key creation state
  const [showCreateKey, setShowCreateKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creatingKey, setCreatingKey] = useState(false)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null)

  const { plan } = usePlan()

  const { data: integrations = [], refetch: refetchIntegrations } = useQuery({
    queryKey: ['integrations', user?.id],
    queryFn: () => fetchIntegrations(user!.id),
    enabled: !!user?.id,
  })

  const { data: apiKeys = [], refetch: refetchKeys } = useQuery({
    queryKey: ['api-keys', user?.id],
    queryFn: () => fetchApiKeys(user!.id),
    enabled: !!user?.id,
  })

  function isConnected(provider: string) {
    return integrations.some((i) => i.provider === provider)
  }

  // Handle OAuth redirect params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get('integration_success')
    const error = params.get('integration_error')
    const billing = params.get('billing')

    if (success) {
      void refetchIntegrations()
      setOauthMessage({ type: 'success', text: `${success.toUpperCase()} connected successfully.` })
      window.history.replaceState({}, '', '/settings')
    } else if (error) {
      setOauthMessage({ type: 'error', text: `Connection failed: ${error.replace(/_/g, ' ')}` })
      window.history.replaceState({}, '', '/settings')
    }

    if (billing === 'success') {
      setBillingSuccess(true)
      window.history.replaceState({}, '', '/settings')
    }
  }, [refetchIntegrations])

  function handleConnect(provider: string) {
    window.location.href = `/api/google/auth?provider=${provider}&user_id=${user?.id ?? ''}`
  }

  async function handleDisconnect(provider: string) {
    if (!user?.id) return
    setDisconnecting(provider)
    try {
      await disconnectIntegration(user.id, provider)
      await refetchIntegrations()
    } finally {
      setDisconnecting(null)
    }
  }

  async function handleSlackSave() {
    if (!user?.id || !slackUrl.trim()) return
    setSlackSaving(true)
    setSlackStatus(null)
    try {
      await saveSlackWebhook(user.id, slackUrl.trim())
      const r = await fetch('/api/slack/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_url: slackUrl.trim() }),
      })
      if (!r.ok) throw new Error('Test notification failed')
      await refetchIntegrations()
      setSlackStatus({ type: 'success', text: 'Slack connected and test message sent.' })
      toast('Slack connected!', 'success')
      setSlackUrl('')
    } catch (err) {
      setSlackStatus({ type: 'error', text: err instanceof Error ? err.message : 'Failed to connect Slack' })
    } finally {
      setSlackSaving(false)
    }
  }

  async function handleUpgrade(priceId: string) {
    setBillingLoading(true)
    try {
      const { url } = await createCheckoutSession(priceId)
      if (url) window.location.href = url
    } finally {
      setBillingLoading(false)
    }
  }

  async function handleManageBilling() {
    setBillingLoading(true)
    try {
      const { url } = await createPortalSession()
      if (url) window.location.href = url
    } finally {
      setBillingLoading(false)
    }
  }

  function toggleKeyVisibility(id: string) {
    setVisibleKeys((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleCreateKey() {
    if (!user?.id || !newKeyName.trim()) return
    setCreatingKey(true)
    try {
      const raw = await createApiKey(user.id, newKeyName.trim())
      setRevealedKey(raw)
      setNewKeyName('')
      setShowCreateKey(false)
      await refetchKeys()
    } finally {
      setCreatingKey(false)
    }
  }

  async function handleDeleteKey(keyId: string) {
    setDeletingKeyId(keyId)
    try {
      await deleteApiKey(keyId)
      await refetchKeys()
    } finally {
      setDeletingKeyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account, billing, integrations, and API access
        </p>
      </div>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">
            <User className="mr-1.5 h-3.5 w-3.5" />
            Account
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="mr-1.5 h-3.5 w-3.5" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Plug className="mr-1.5 h-3.5 w-3.5" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="api-keys">
            <Key className="mr-1.5 h-3.5 w-3.5" />
            API Keys
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile Information</CardTitle>
              <CardDescription>
                Update your account details and profile picture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar
                  size="lg"
                  alt={name}
                  src={user?.avatarUrl ?? undefined}
                />
                <div>
                  <Button variant="outline" size="sm">Change Avatar</Button>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG. Max 2MB.</p>
                </div>
              </div>

              <Separator />

              {/* Name */}
              <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="name">
                    Full name
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="email">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Button size="sm">Save Changes</Button>
              </div>

              <Separator />

              {/* Danger Zone */}
              <div>
                <h3 className="text-sm font-semibold text-danger mb-2">Danger Zone</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="space-y-6">
            {billingSuccess && (
              <div className="flex items-center justify-between text-sm px-4 py-3 rounded-lg bg-success/10 text-success">
                <span>Your plan has been updated!</span>
                <button type="button" onClick={() => setBillingSuccess(false)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current Plan</CardTitle>
                <CardDescription>
                  You are on the <span className="font-medium text-foreground capitalize">{plan}</span> plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-semibold text-foreground capitalize">{plan} Plan</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {plan === 'free' ? 'Limited features' : 'Full access to all features'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={billingLoading || plan === 'free'}
                    onClick={() => void handleManageBilling()}
                  >
                    Manage Billing
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Available Plans</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {PRICING_TIERS.map((tier) => (
                  <PlanCard
                    key={tier.id}
                    tier={tier}
                    isCurrentPlan={tier.id === plan}
                    onUpgrade={handleUpgrade}
                  />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="space-y-4">
            {oauthMessage && (
              <div className={`text-sm px-4 py-3 rounded-lg ${oauthMessage.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                {oauthMessage.text}
              </div>
            )}

            {INTEGRATIONS.map((integration) => {
              const connected = isConnected(integration.id)
              return (
                <Card key={integration.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                        <integration.icon className={`h-5 w-5 ${integration.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground">{integration.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{integration.description}</p>

                        {/* Slack-specific webhook input when disconnected */}
                        {integration.id === 'slack' && !connected && (
                          <div className="mt-3 space-y-2">
                            <Input
                              placeholder="https://hooks.slack.com/services/..."
                              value={slackUrl}
                              onChange={(e) => setSlackUrl(e.target.value)}
                              className="max-w-sm text-xs"
                            />
                            {slackStatus && (
                              <p className={`text-xs ${slackStatus.type === 'success' ? 'text-success' : 'text-danger'}`}>
                                {slackStatus.text}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {connected ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="success" className="gap-1">
                              <Check className="h-3 w-3" />
                              Connected
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={disconnecting === integration.id}
                              onClick={() => void handleDisconnect(integration.id)}
                            >
                              {disconnecting === integration.id ? 'Disconnecting…' : 'Disconnect'}
                            </Button>
                          </div>
                        ) : integration.id === 'slack' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            disabled={slackSaving || !slackUrl.trim()}
                            onClick={() => void handleSlackSave()}
                          >
                            {slackSaving ? 'Saving…' : 'Save & Test'}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleConnect(integration.id)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys">
          <PlanGate require="business">
            <div className="space-y-4">
              {/* Revealed key banner — shown once after creation */}
              {revealedKey && (
                <div className="flex items-start justify-between gap-4 px-4 py-3 rounded-lg bg-success/10 border border-success/20">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-success">Copy this key — you won&apos;t see it again</p>
                    <code className="block text-xs font-mono text-foreground break-all">{revealedKey}</code>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => handleCopy(revealedKey, 'revealed')}
                    >
                      {copied === 'revealed' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied === 'revealed' ? 'Copied' : 'Copy'}
                    </Button>
                    <button type="button" onClick={() => setRevealedKey(null)}>
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </button>
                  </div>
                </div>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">API Keys</CardTitle>
                      <CardDescription>
                        Manage API keys for programmatic access to Caposeo
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setShowCreateKey((v) => !v)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Create Key
                    </Button>
                  </div>

                  {/* Inline create form */}
                  {showCreateKey && (
                    <div className="flex items-center gap-2 mt-3">
                      <Input
                        placeholder="Key name (e.g. Production API)"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="max-w-xs text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void handleCreateKey()
                          if (e.key === 'Escape') { setShowCreateKey(false); setNewKeyName('') }
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        disabled={creatingKey || !newKeyName.trim()}
                        onClick={() => void handleCreateKey()}
                      >
                        {creatingKey ? 'Creating…' : 'Create'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setShowCreateKey(false); setNewKeyName('') }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {apiKeys.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                      No API keys yet. Create one above to get started.
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {apiKeys.map((apiKey) => (
                        <div key={apiKey.id} className="flex items-center justify-between px-5 py-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{apiKey.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="text-xs text-muted-foreground font-mono">
                                {visibleKeys.has(apiKey.id)
                                  ? `${apiKey.key_prefix}...`
                                  : `${apiKey.key_prefix}${'*'.repeat(16)}`
                                }
                              </code>
                              <button
                                type="button"
                                onClick={() => toggleKeyVisibility(apiKey.id)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {visibleKeys.has(apiKey.id) ? (
                                  <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopy(apiKey.key_prefix + '...', apiKey.id)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {copied === apiKey.id ? (
                                  <Check className="h-3.5 w-3.5 text-success" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                              <span>Created: {new Date(apiKey.created_at).toLocaleDateString()}</span>
                              <span>Last used: {apiKey.last_used_at ? new Date(apiKey.last_used_at).toLocaleDateString() : 'Never'}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:text-danger shrink-0"
                            disabled={deletingKeyId === apiKey.id}
                            onClick={() => void handleDeleteKey(apiKey.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </PlanGate>
        </TabsContent>
      </Tabs>
    </div>
  )
}
