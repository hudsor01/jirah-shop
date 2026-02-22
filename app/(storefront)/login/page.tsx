import type { Metadata } from 'next'
import Link from 'next/link'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import AuthBackgroundShape from '@/public/auth-background-shape'
import { GoogleSignInButton } from './google-sign-in-button'
import { LoginForm } from './login-form'

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Sign In — Jirah Shop',
	}
}

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ redirect?: string; error?: string; message?: string }>
}) {
	const params = await searchParams
	const redirectTo = params.redirect ?? '/'
	const errorParam = params.error
	const messageParam = params.message

	const errorMessages: Record<string, string> = {
		auth_callback_failed: 'Authentication failed. Please try again.',
		confirmation_failed: 'Email confirmation failed. Please try again.',
	}

	const errorMessage = errorParam
		? (errorMessages[errorParam] ?? errorParam)
		: null

	return (
		<div className='relative flex min-h-[calc(100vh-10rem)] items-center justify-center overflow-x-hidden px-4 py-12'>
			<div className='absolute'>
				<AuthBackgroundShape />
			</div>

			<Card className='z-[1] w-full border-none shadow-md sm:max-w-lg'>
				<CardHeader className='gap-6'>
					{/* Brand Logo */}
					<Link href='/' className='inline-block'>
						<span className='font-serif text-2xl font-bold tracking-tight'>
							<span className='text-primary'>J</span>irah Shop
						</span>
					</Link>

					<div>
						<CardTitle className='mb-1.5 font-serif text-2xl'>
							Sign In
						</CardTitle>
						<CardDescription className='text-base'>
							Enter your credentials to access your account
						</CardDescription>
					</div>
				</CardHeader>

				<CardContent className='space-y-6'>
					{/* Success message */}
					{messageParam && (
						<div className='rounded-md bg-secondary px-4 py-3 text-sm text-secondary-foreground'>
							{messageParam}
						</div>
					)}

					{/* Error message from URL params */}
					{errorMessage && (
						<div className='rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive'>
							{errorMessage}
						</div>
					)}

					{/* Google OAuth */}
					<GoogleSignInButton />

					<div className='flex items-center gap-4'>
						<Separator className='flex-1' />
						<span className='text-xs text-muted-foreground'>or</span>
						<Separator className='flex-1' />
					</div>

					{/* Email / Password Form */}
					<LoginForm redirectTo={redirectTo} />
				</CardContent>

				<CardFooter className='justify-center'>
					<p className='text-sm text-muted-foreground'>
						Don&apos;t have an account?{' '}
						<Link
							href='/signup'
							className='font-medium text-primary underline-offset-4 hover:underline'
						>
							Sign up
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	)
}
