'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Globe, Mail, Lock, User, Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = signInSchema.extend({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignInData = z.infer<typeof signInSchema>;
type SignUpData = z.infer<typeof signUpSchema>;

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';
  const [tab, setTab] = useState<'signin' | 'signup'>(defaultTab as 'signin' | 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, user, loading: authLoading } = useAuth();

  const signInForm = useForm<SignInData>({ resolver: zodResolver(signInSchema) });
  const signUpForm = useForm<SignUpData>({ resolver: zodResolver(signUpSchema) });

  // Redirect authenticated users away from the join page
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-cultural-gradient flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Verifying session...</p>
      </div>
    );
  }

  const handleSignIn = async (data: SignInData) => {
    setLoading(true);
    try {
      await signIn(data.email, data.password);
      toast.success('Welcome back!');
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in';
      toast.error(msg.includes('invalid-credential') ? 'Invalid email or password' : 'Sign in failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpData) => {
    setLoading(true);
    try {
      await signUp(data.email, data.password, data.displayName);
      toast.success('Welcome to the community!');
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      toast.error(msg.includes('email-already-in-use') ? 'Email already registered' : 'Sign up failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome to Saurashtra Connect!');
      router.push('/');
    } catch {
      toast.error('Google sign in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-cultural-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-gray-900">Saurashtra Connect</h1>
          <p className="text-gray-500 mt-1.5">Preserving our language, together.</p>
        </div>

        <div className="card p-8 shadow-xl border border-gray-100">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
            {(['signin', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'signin' ? 'Sign In' : 'Join Community'}
              </button>
            ))}
          </div>

          {/* Google Sign-in */}
          <Button
            variant="secondary"
            className="w-full mb-5"
            loading={googleLoading}
            onClick={handleGoogle}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            }
          >
            Continue with Google
          </Button>

          <div className="relative mb-5">
            <hr className="border-gray-200" />
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-3 text-xs text-gray-400 font-medium">
              or with email
            </span>
          </div>

          {/* Sign In Form */}
          {tab === 'signin' && (
            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                error={signInForm.formState.errors.email?.message}
                {...signInForm.register('email')}
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  error={signInForm.formState.errors.password?.message}
                  {...signInForm.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-right">
                <Link href="/forgot-password" className="text-xs text-primary-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" className="w-full" loading={loading} icon={<LogIn className="w-4 h-4" />}>
                Sign In
              </Button>
            </form>
          )}

          {/* Sign Up Form */}
          {tab === 'signup' && (
            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="Your full name"
                error={signUpForm.formState.errors.displayName?.message}
                {...signUpForm.register('displayName')}
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                error={signUpForm.formState.errors.email?.message}
                {...signUpForm.register('email')}
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  error={signUpForm.formState.errors.password?.message}
                  {...signUpForm.register('password')}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                error={signUpForm.formState.errors.confirmPassword?.message}
                {...signUpForm.register('confirmPassword')}
              />
              <p className="text-xs text-gray-400">
                By joining, you agree to contribute to the Saurashtra language preservation project.
              </p>
              <Button type="submit" className="w-full" loading={loading} icon={<User className="w-4 h-4" />}>
                Create Account
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Free, open, and community-driven forever ❤️
        </p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>}>
      <JoinContent />
    </Suspense>
  );
}
