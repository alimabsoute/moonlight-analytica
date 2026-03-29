import { useState } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Avatar } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/auth'
import { PRICING_TIERS } from '@/lib/stripe'
import type { PricingTier } from '@/lib/stripe'

interface Integration {
  id: string
  name: string
  description: string
  icon: typeof Search
  connected: boolean
  color: string
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'gsc',
    name: 'Google Search Console',
    description: 'Import real keyword data, clicks, impressions, and crawl stats',
    icon: Search,
    connected: false,
    color: 'text-[#4285f4]',
  },
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    description: 'Connect traffic data, user behavior, and conversion tracking',
    icon: BarChart3,
    connected: false,
    color: 'text-[#f59e0b]',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Receive SEO alerts, rank changes, and audit notifications in Slack',
    icon: MessageSquare,
    connected: false,
    color: 'text-[#e01e5a]',
  },
]

interface ApiKey {
  id: string
  name: string
  key: string
  createdAt: string
  lastUsed: string | null
}

const DEMO_API_KEYS: ApiKey[] = [
  {
    id: '1',
    name: 'Production API',
    key: 'sp_live_a1b2c3d4e5f6g7h8i9j0',
    createdAt: '2026-03-15',
    lastUsed: '2026-03-28',
  },
  {
    id: '2',
    name: 'Development',
    key: 'sp_test_x9y8w7v6u5t4s3r2q1p0',
    createdAt: '2026-03-20',
    lastUsed: null,
  },
]

function PlanCard({ tier, isCurrentPlan }: { tier: PricingTier; isCurrentPlan: boolean }) {
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
          <Button variant={tier.id === 'pro' ? 'default' : 'outline'} className="w-full">
            {tier.price === 0 ? 'Downgrade' : 'Upgrade'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const [name, setName] = useState(user?.fullName ?? 'Demo User')
  const [email, setEmail] = useState(user?.email ?? 'demo@seopulse.io')
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState<string | null>(null)

  const currentPlan = user?.plan ?? 'free'

  function toggleKeyVisibility(id: string) {
    setVisibleKeys((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleCopy(key: string, id: string) {
    navigator.clipboard.writeText(key).catch(() => {})
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current Plan</CardTitle>
                <CardDescription>
                  You are on the <span className="font-medium text-foreground capitalize">{currentPlan}</span> plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-semibold text-foreground capitalize">{currentPlan} Plan</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {currentPlan === 'free' ? 'Limited features' : 'Full access to all features'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Manage Subscription</Button>
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
                    isCurrentPlan={tier.id === currentPlan}
                  />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="space-y-4">
            {INTEGRATIONS.map((integration) => (
              <Card key={integration.id}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <integration.icon className={`h-5 w-5 ${integration.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{integration.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{integration.description}</p>
                    </div>
                    <div className="shrink-0">
                      {integration.connected ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="success" className="gap-1">
                            <Check className="h-3 w-3" />
                            Connected
                          </Badge>
                          <Button variant="ghost" size="sm">Disconnect</Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">API Keys</CardTitle>
                  <CardDescription>
                    Manage API keys for programmatic access to SEO Pulse
                  </CardDescription>
                </div>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Create Key
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {DEMO_API_KEYS.map((apiKey) => (
                  <div key={apiKey.id} className="flex items-center justify-between px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{apiKey.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs text-muted-foreground font-mono">
                          {visibleKeys.has(apiKey.id)
                            ? apiKey.key
                            : `${apiKey.key.slice(0, 12)}${'*'.repeat(16)}`
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
                          onClick={() => handleCopy(apiKey.key, apiKey.id)}
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
                        <span>Created: {apiKey.createdAt}</span>
                        <span>Last used: {apiKey.lastUsed ?? 'Never'}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-danger hover:text-danger shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
