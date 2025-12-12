import ProfileCard from '../components/settings/ProfileCard'
import PreferencesForm from '../components/settings/PreferencesForm'
import Card from '../components/common/Card'
import ThemeToggle from '../components/common/ThemeToggle'
import Button from '../components/common/Button'

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <ProfileCard />
        </div>
        <Card title="Theme" subtitle="Switch visual styles instantly" className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100">Interface mode</p>
              <p className="text-xs text-slate-400">Toggle between light and dark experiences.</p>
            </div>
            <ThemeToggle />
          </div>
        </Card>
      </div>

      <PreferencesForm />

      <Card title="Integrations" subtitle="Prepare API keys and webhooks for backend access.">
        <div className="space-y-3 text-sm text-slate-300">
          <p>Placeholder for API key management. Backend team can drop in secure forms later.</p>
          <Button variant="secondary">Generate Test Key</Button>
        </div>
      </Card>
    </div>
  )
}

export default SettingsPage
