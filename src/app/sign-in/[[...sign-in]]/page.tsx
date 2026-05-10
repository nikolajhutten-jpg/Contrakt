'use client'

import { useSignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

function mapClerkError(err: unknown): string {
  const code = (err as { errors?: Array<{ code: string }> })?.errors?.[0]?.code ?? ''
  if (code === 'form_password_incorrect' || code === 'invalid_credentials') {
    return 'Incorrect email or password.'
  }
  if (code === 'too_many_attempts') {
    return 'Too many attempts. Please try again later.'
  }
  return 'Something went wrong. Please try again.'
}

type Mode = 'signin' | 'forgot-request' | 'forgot-verify'

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '38px',
  border: '0.5px solid rgba(0,0,0,0.15)',
  borderRadius: '8px',
  padding: '0 12px',
  fontSize: '14px',
  color: '#171717',
  background: '#ffffff',
  boxSizing: 'border-box',
  outline: 'none',
}

const labelBase: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 500,
  color: '#171717',
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
}

const labelBlock: React.CSSProperties = {
  ...labelBase,
  display: 'block',
  marginBottom: '6px',
}

const submitButtonStyle = (disabled: boolean): React.CSSProperties => ({
  display: 'block',
  width: '100%',
  height: '38px',
  background: '#1a1a1a',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: disabled ? 'default' : 'pointer',
  marginTop: '20px',
  opacity: disabled ? 0.7 : 1,
})

export default function SignInPage() {
  const { signIn, fetchStatus } = useSignIn()
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const ready = fetchStatus === 'idle'

  function goTo(next: Mode) {
    setMode(next)
    setErrorMsg('')
  }

  function onFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = '#1a1a1a'
  }

  function onBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      await signIn.create({ identifier: email, password })
      if (signIn.status === 'complete') {
        await signIn.finalize()
        router.push('/dashboard')
      } else {
        setErrorMsg('Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      setErrorMsg(mapClerkError(err))
      setLoading(false)
    }
  }

  async function handleForgotRequest(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      await signIn.create({ identifier: email })
      await signIn.resetPasswordEmailCode.sendCode()
      goTo('forgot-verify')
    } catch (err) {
      setErrorMsg(mapClerkError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      await signIn.resetPasswordEmailCode.verifyCode({ code })
      await signIn.resetPasswordEmailCode.submitPassword({ password })
      await signIn.finalize()
      router.push('/dashboard')
    } catch (err) {
      setErrorMsg(mapClerkError(err))
      setLoading(false)
    }
  }

  const errorEl = errorMsg ? (
    <p style={{ fontSize: '13px', color: '#c0392b', margin: '12px 0 0', textAlign: 'center' }}>
      {errorMsg}
    </p>
  ) : null

  const backLink = (
    <button
      type="button"
      onClick={() => goTo('signin')}
      style={{ background: 'none', border: 'none', padding: 0, fontSize: '13px', color: 'rgba(0,0,0,0.45)', cursor: 'pointer', marginTop: '16px', display: 'block' }}
      onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
      onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
    >
      ← Back to sign in
    </button>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 'calc(100% - 48px)', maxWidth: '400px', background: '#ffffff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '40px' }}>

        <div style={{ fontSize: '15px', fontWeight: 600, color: '#171717', letterSpacing: '-0.02em', marginBottom: '32px' }}>
          Contrakt
        </div>

        {/* ── Sign in ── */}
        {mode === 'signin' && (
          <>
            <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#171717', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
              Sign in
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(0,0,0,0.45)', margin: '0 0 28px' }}>
              Enter your details to continue
            </p>

            <form onSubmit={handleSignIn} noValidate>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelBlock}>Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={labelBase}>Password</label>
                  <button
                    type="button"
                    onClick={() => goTo('forgot-request')}
                    style={{ background: 'none', border: 'none', padding: 0, fontSize: '12px', color: 'rgba(0,0,0,0.45)', cursor: 'pointer', textDecoration: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                    onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <button type="submit" disabled={loading || !ready} style={submitButtonStyle(loading || !ready)}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
              {errorEl}
            </form>

            <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'rgba(0,0,0,0.45)' }}>
              Don&apos;t have an account?{' '}
              <Link
                href="/sign-up"
                style={{ color: '#171717', fontWeight: 500, textDecoration: 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
              >
                Sign up
              </Link>
            </p>
          </>
        )}

        {/* ── Forgot — step 1: request code ── */}
        {mode === 'forgot-request' && (
          <>
            <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#171717', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
              Reset password
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(0,0,0,0.45)', margin: '0 0 28px' }}>
              Enter your email to receive a reset code
            </p>

            <form onSubmit={handleForgotRequest} noValidate>
              <div>
                <label style={labelBlock}>Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <button type="submit" disabled={loading || !ready} style={submitButtonStyle(loading || !ready)}>
                {loading ? 'Sending…' : 'Send reset code'}
              </button>
              {errorEl}
            </form>

            {backLink}
          </>
        )}

        {/* ── Forgot — step 2: verify code + new password ── */}
        {mode === 'forgot-verify' && (
          <>
            <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#171717', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
              Set new password
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(0,0,0,0.45)', margin: '0 0 28px' }}>
              Enter the code sent to your email and choose a new password
            </p>

            <form onSubmit={handleForgotVerify} noValidate>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelBlock}>Reset code</label>
                <input
                  type="text"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <div>
                <label style={labelBlock}>New password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <button type="submit" disabled={loading || !ready} style={submitButtonStyle(loading || !ready)}>
                {loading ? 'Resetting…' : 'Reset password'}
              </button>
              {errorEl}
            </form>

            {backLink}
          </>
        )}

      </div>
    </main>
  )
}
