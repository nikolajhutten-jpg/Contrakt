import { SignIn } from '@clerk/nextjs'
export default function SignInPage() {
  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f7' }}>
      <SignIn appearance={{
        variables: {
          colorPrimary: '#1d1d1f',
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorInputText: '#1d1d1f',
          borderRadius: '10px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          fontSize: '14px',
        },
        elements: {
          card: {
            boxShadow: 'none',
            border: '0.5px solid rgba(0,0,0,0.12)',
            borderRadius: '14px',
          },
          formButtonPrimary: {
            backgroundColor: '#1d1d1f',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
          },
          footerActionLink: {
            color: '#1d1d1f',
          },
        },
      }} />
    </main>
  )
}
