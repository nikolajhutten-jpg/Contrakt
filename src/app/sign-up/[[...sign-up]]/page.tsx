import { SignUp } from '@clerk/nextjs'
export default function SignUpPage() {
  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f7' }}>
      <SignUp />
    </main>
  )
}
