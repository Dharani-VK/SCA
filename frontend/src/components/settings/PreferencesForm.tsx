import Card from '../common/Card'
import Toggle from '../common/Toggle'
import useAppStore, { type AppState } from '../../store/useAppStore'

function PreferencesForm() {
  const { notificationPrefs, updateNotificationPref } = useAppStore((state: AppState) => ({
    notificationPrefs: state.notificationPrefs,
    updateNotificationPref: state.updateNotificationPref,
  }))

  const handleToggle = (key: keyof typeof notificationPrefs) => (value: boolean) => {
    updateNotificationPref(key, value)
  }

  return (
    <Card title="Notifications" subtitle="Choose how you stay informed.">
      <div className="space-y-4">
        <Toggle
          checked={Boolean(notificationPrefs.summaryEmail)}
          onChange={handleToggle('summaryEmail')}
          label="Email me AI summaries"
        />
        <Toggle
          checked={Boolean(notificationPrefs.weeklyDigest)}
          onChange={handleToggle('weeklyDigest')}
          label="Send a weekly campus digest"
        />
        <Toggle
          checked={Boolean(notificationPrefs.ingestionAlerts)}
          onChange={handleToggle('ingestionAlerts')}
          label="Alert me when ingestion completes"
        />
      </div>
    </Card>
  )
}

export default PreferencesForm
