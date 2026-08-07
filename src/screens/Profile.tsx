'use client'

import { BookOpen, Download, KeyRound, LogOut, Moon, RotateCcw, Settings, Smartphone, Upload, UserRound } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ThemeToggle } from '../components/theme/ThemeToggle'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/Switch'
import type { SettingsState, User } from '../types'
import { buildSalaryPlans } from '../utils/models'
import { Guide } from './Guide'
import { Setup } from './Setup'

type ProfileSection = 'account' | 'setup' | 'preferences' | 'guide' | 'backup' | 'appearance'

const sections = [
  { id: 'account', label: 'Account', icon: UserRound },
  { id: 'setup', label: 'Setup', icon: Settings },
  { id: 'preferences', label: 'Preferences', icon: Smartphone },
  { id: 'guide', label: 'Guide', icon: BookOpen },
  { id: 'backup', label: 'Backup & reset', icon: Download },
  { id: 'appearance', label: 'Appearance', icon: Moon },
] as const

export function Profile({
  user,
  settings,
  salaryPlans,
  onUpdateUser,
  onChangePassword,
  onUpdateSettings,
  onImportJson,
  onExportJson,
  onReset,
  onLogout,
}: {
  user: User
  settings: SettingsState
  salaryPlans: ReturnType<typeof buildSalaryPlans>
  onUpdateUser: (input: { name: string }) => Promise<void>
  onChangePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>
  onUpdateSettings: (settings: Partial<SettingsState>) => void
  onImportJson: (file: File) => void
  onExportJson: () => void
  onReset: () => void
  onLogout: () => void
}) {
  const [section, setSection] = useState<ProfileSection>('account')
  const [name, setName] = useState(user.name)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const backupInput = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setName(user.name)
  }, [user])

  async function saveAccount(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await onUpdateUser({ name })
      toast.success('Profile updated')
    } catch (error) {
      toast.error('Could not update profile', { description: error instanceof Error ? error.message : 'Please try again' })
    } finally {
      setSaving(false)
    }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault()
    if (newPassword !== confirmPassword) return toast.error('New passwords do not match')
    setSaving(true)
    try {
      await onChangePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password changed')
    } catch (error) {
      toast.error('Could not change password', { description: error instanceof Error ? error.message : 'Please try again' })
    } finally {
      setSaving(false)
    }
  }

  async function updateShakePreference(enabled: boolean) {
    onUpdateSettings({ shakeToOpenLedger: enabled })
    if (!enabled || typeof DeviceMotionEvent === 'undefined') return

    const motionEvent = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }
    const permission = await motionEvent.requestPermission?.().catch(() => 'denied')
    if (permission === 'denied') {
      toast.info('Motion access was not granted', {
        description: 'Shake to open Ledger is enabled, but this browser will not detect shakes until motion access is allowed.',
      })
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Profile sections">
        {sections.map(({ id, label, icon: Icon }) => (
          <Button className="shrink-0" key={id} variant={section === id ? 'default' : 'outline'} type="button" onClick={() => setSection(id)}>
            <Icon size={16} /> {label}
          </Button>
        ))}
      </div>

      {section === 'account' && <div className="grid gap-4 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Personal information</CardTitle><CardDescription>Update how your profile appears in Track Your Money.</CardDescription></CardHeader><CardContent>
          <form className="grid gap-5" onSubmit={saveAccount}>
            <div className="grid gap-1.5"><Label htmlFor="profile-name">Name</Label><Input id="profile-name" minLength={2} maxLength={60} value={name} onChange={(event) => setName(event.target.value)} required /></div>
            <div className="grid gap-1.5"><Label htmlFor="profile-email">Email</Label><Input id="profile-email" value={user.email} disabled /><p className="text-xs text-muted-foreground">Your email is used to sign in and cannot be changed here.</p></div>
            <Button className="w-fit" disabled={saving} type="submit">Save profile</Button>
          </form>
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound size={18} /> Change password</CardTitle><CardDescription>Use at least 8 characters for your new password.</CardDescription></CardHeader><CardContent>
          <form className="grid gap-4" onSubmit={savePassword}>
            <div className="grid gap-1.5"><Label htmlFor="current-password">Current password</Label><Input id="current-password" autoComplete="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></div>
            <div className="grid gap-1.5"><Label htmlFor="new-password">New password</Label><Input id="new-password" autoComplete="new-password" minLength={8} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></div>
            <div className="grid gap-1.5"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" autoComplete="new-password" minLength={8} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></div>
            <Button className="w-fit" disabled={saving} type="submit">Update password</Button>
          </form>
        </CardContent></Card>

        <Card className="xl:col-span-2"><CardHeader><CardTitle>Session</CardTitle><CardDescription>Sign out of this device when you are finished.</CardDescription></CardHeader><CardContent><Button variant="outline" type="button" onClick={onLogout}><LogOut size={16} /> Sign out</Button></CardContent></Card>
      </div>}

      {section === 'setup' && <Setup settings={settings} salaryPlans={salaryPlans} onUpdateSettings={onUpdateSettings} />}
      {section === 'preferences' && <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Choose how you want to move around Track Your Money.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/40 p-4">
            <div className="min-w-0">
              <Label htmlFor="shake-to-open-ledger">Shake to open Ledger</Label>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Shake your device to jump straight to the Ledger. This feature works only on devices with motion support, mainly phones and some tablets, and may also require browser permission.
              </p>
            </div>
            <Switch
              id="shake-to-open-ledger"
              checked={settings.shakeToOpenLedger}
              aria-describedby="shake-to-open-ledger-note"
              onCheckedChange={(checked) => void updateShakePreference(checked)}
            />
          </div>
          <p id="shake-to-open-ledger-note" className="mt-3 text-xs text-muted-foreground">
            It may not work on laptops, desktop computers, or browsers that do not provide device-motion access.
          </p>

          <div className="mt-4 flex items-start justify-between gap-4 rounded-lg border bg-muted/40 p-4">
            <div className="min-w-0">
              <Label htmlFor="rollover-enabled">Carry over unused budget</Label>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Roll last salary cycle&apos;s leftover (or deficit) into this cycle&apos;s budget, instead of starting fresh every cycle. Only applies when using Salary Cycle mode.
              </p>
            </div>
            <Switch
              id="rollover-enabled"
              checked={settings.rolloverEnabled}
              onCheckedChange={(checked) => onUpdateSettings({ rolloverEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>}
      {section === 'guide' && <Guide />}
      {section === 'backup' && <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Backup your data</CardTitle><CardDescription>Export all settings and transactions, or restore them from a JSON backup.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-3">
          <Button type="button" onClick={onExportJson}><Download size={16} /> Export backup</Button>
          <Button variant="outline" type="button" onClick={() => backupInput.current?.click()}><Upload size={16} /> Import backup</Button>
          <Input className="hidden" ref={backupInput} type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImportJson(file); event.target.value = '' }} />
        </CardContent></Card>
        <Card className="border-destructive/30"><CardHeader><CardTitle>Reset workspace</CardTitle><CardDescription>Permanently replace your settings and transactions with a clean workspace.</CardDescription></CardHeader><CardContent>
          <ConfirmDialog destructive title="Reset your workspace?" description="This permanently replaces your settings and transactions with the default data. Export a backup first if you may need them later." confirmLabel="Reset workspace" onConfirm={onReset} trigger={<Button variant="destructive" type="button"><RotateCcw size={16} /> Reset workspace</Button>} />
        </CardContent></Card>
      </div>}
      {section === 'appearance' && <Card className="max-w-2xl"><CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Choose the color mode that is most comfortable for you.</CardDescription></CardHeader><CardContent className="flex items-center justify-between gap-4 rounded-lg border bg-muted/40 p-4"><div><strong className="text-sm">Light or dark mode</strong><p className="mt-1 text-xs text-muted-foreground">Your preference is saved on this device.</p></div><ThemeToggle /></CardContent></Card>}
    </div>
  )
}
