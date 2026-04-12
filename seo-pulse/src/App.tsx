import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, useEffect, type ComponentType } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { useUIStore } from '@/stores/ui'

// Error boundary for lazy pages
function lazyPage(importFn: () => Promise<{ [key: string]: ComponentType }>, name: string) {
  return lazy(() =>
    importFn()
      .then(m => ({ default: (m[name] ?? m.default) as ComponentType }))
      .catch(err => {
        console.error(`Failed to load ${name}:`, err)
        return { default: () => <div className="p-8 text-red-500">Failed to load {name}</div> }
      })
  )
}

const DashboardPage = lazyPage(() => import('@/app/dashboard/page'), 'DashboardPage')
const ExplorerPage = lazyPage(() => import('@/app/explorer/page'), 'ExplorerPage')
const KeywordsPage = lazyPage(() => import('@/app/keywords/page'), 'KeywordsPage')
const RankTrackerPage = lazyPage(() => import('@/app/rank-tracker/page'), 'RankTrackerPage')
const SiteAuditPage = lazyPage(() => import('@/app/site-audit/page'), 'SiteAuditPage')
const CompetitorsPage = lazyPage(() => import('@/app/competitors/page'), 'CompetitorsPage')
const ContentEditorPage = lazyPage(() => import('@/app/content-editor/page'), 'ContentEditorPage')
const PulseLabPage = lazyPage(() => import('@/app/pulse-lab/page'), 'PulseLabPage')
const ReportsPage = lazyPage(() => import('@/app/reports/page'), 'ReportsPage')
const SettingsPage = lazyPage(() => import('@/app/settings/page'), 'SettingsPage')
const LoginPage = lazyPage(() => import('@/app/login/page'), 'LoginPage')
const OnboardingPage = lazyPage(() => import('@/app/onboarding/page'), 'OnboardingPage')

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

export function App() {
  const theme = useUIStore(s => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/explorer" element={<ExplorerPage />} />
          <Route path="/keywords" element={<KeywordsPage />} />
          <Route path="/rank-tracker" element={<RankTrackerPage />} />
          <Route path="/site-audit" element={<SiteAuditPage />} />
          <Route path="/competitors" element={<CompetitorsPage />} />
          <Route path="/content-editor" element={<ContentEditorPage />} />
          <Route path="/pulse-lab" element={<PulseLabPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
