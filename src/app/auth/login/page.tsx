'use client'

import { Suspense, useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const callbackUrl = params.get('callbackUrl') ?? '/dashboard'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError('Invalid email or password')
    } else {
      router.push(callbackUrl)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <Input
        id="password"
        type="password"
        label="Password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" loading={loading}>
        Sign in
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 ring-1 ring-accent/30">
            <Zap className="h-6 w-6 text-accent-light" />
          </div>
          <h1 className="text-xl font-bold text-gray-100">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your ResellerHub account</p>
        </div>

        <Suspense fallback={<div className="space-y-4 opacity-50 pointer-events-none" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-accent-light hover:underline">
            Create one
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-gray-600">
          Demo: <span className="font-mono">demo@reseller.com</span> /{' '}
          <span className="font-mono">password123</span>
        </p>
      </div>
    </div>
  )
}
