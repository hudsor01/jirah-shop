import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import AuthBackgroundShape from '@/public/auth-background-shape'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Reset Password — Jirah Shop',
	}
}

export default async function ResetPasswordPage({
	searchParams,
}: {
	searchParams: Promise<{ error?: string }>
}) {
	const params = await searchParams
	const error = params.error ?? null

	return (
		<div className='relative flex min-h-[calc(100vh-10rem)] items-center justify-center overflow-x-hidden px-4 py-12'>
			<div className='absolute'>
				<AuthBackgroundShape />
			</div>

			<Card className='z-[1] w-full border-none shadow-md sm:max-w-md'>
				<CardHeader className='gap-6'>
					{/* Brand Logo */}
					<Link href='/' className='inline-block'>
						<span className='font-serif text-2xl font-bold tracking-tight'>
							<span className='text-primary'>J</span>irah Shop
						</span>
					</Link>

					<div>
						<CardTitle className='mb-1.5 font-serif text-2xl'>
							Reset Password
						</CardTitle>
						<CardDescription className='text-base'>
							Enter your new password to update your account security
						</CardDescription>
					</div>
				</CardHeader>

				<CardContent className='space-y-4'>
					{/* Error message from URL params */}
					{error && (
						<div className='rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive'>
							{error}
						</div>
					)}

					{/* Reset Password Form */}
					<ResetPasswordForm />

					<Link
						href='/login'
						className='group mx-auto flex w-fit items-center gap-2 text-sm'
					>
						<ChevronLeftIcon className='size-4 transition-transform duration-200 group-hover:-translate-x-0.5' />
						<span>Back to login</span>
					</Link>
				</CardContent>
			</Card>
		</div>
	)
}
