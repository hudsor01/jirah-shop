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
import { GoogleSignUpButton } from './google-sign-up-button'
import { SignupForm } from './signup-form'

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Create Account — Jirah Shop',
	}
}

export default async function SignupPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string }>
}) {
	const params = await searchParams
	const errorMessage = params.error ?? null

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
							Create Account
						</CardTitle>
						<CardDescription className='text-base'>
							Sign up to start shopping and track your orders
						</CardDescription>
					</div>
				</CardHeader>

				<CardContent className='space-y-6'>
					{/* Error message from URL params */}
					{errorMessage && (
						<div className='rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive'>
							{errorMessage}
						</div>
					)}

					{/* Google OAuth */}
					<GoogleSignUpButton />

					<div className='flex items-center gap-4'>
						<Separator className='flex-1' />
						<span className='text-xs text-muted-foreground'>or</span>
						<Separator className='flex-1' />
					</div>

					{/* Signup Form */}
					<SignupForm />
				</CardContent>

				<CardFooter className='justify-center'>
					<p className='text-sm text-muted-foreground'>
						Already have an account?{' '}
						<Link
							href='/login'
							className='font-medium text-primary underline-offset-4 hover:underline'
						>
							Sign in
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	)
}
