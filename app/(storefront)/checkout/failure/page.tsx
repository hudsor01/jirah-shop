'use client'

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
	XCircle,
	ShoppingBag,
	MessageCircle,
	RefreshCcw,
	CreditCard,
	AlertCircle,
	HelpCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const failureReasons = [
	{
		icon: CreditCard,
		title: 'Card declined',
		description: 'Your card was declined by the issuing bank',
	},
	{
		icon: AlertCircle,
		title: 'Insufficient funds',
		description: 'Not enough funds available in your account',
	},
	{
		icon: XCircle,
		title: 'Expired or invalid card',
		description: 'Your card has expired or the details are incorrect',
	},
	{
		icon: HelpCircle,
		title: 'Network error',
		description: 'A connection issue interrupted the transaction',
	},
]

function FailureContent() {
	const searchParams = useSearchParams()
	const error = searchParams.get('error')

	useEffect(() => {
		if (error) {
			toast.error('Payment could not be processed', {
				description: error,
			})
		}
	}, [error])

	return (
		<section className='mx-auto max-w-2xl px-6 py-12 sm:py-20'>
			{/* Progress Indicator */}
			<div className='mb-8 flex items-center justify-center gap-2'>
				<div className='flex items-center gap-2 opacity-50'>
					<div className='flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground'>
						✓
					</div>
					<span className='hidden text-sm font-medium sm:inline'>Cart</span>
				</div>
				<div className='h-px w-12 bg-border sm:w-16' />
				<div className='flex items-center gap-2'>
					<div className='flex size-8 items-center justify-center rounded-full border-2 border-destructive bg-destructive/10 text-sm font-semibold text-destructive'>
						!
					</div>
					<span className='hidden text-sm text-muted-foreground sm:inline'>
						Checkout
					</span>
				</div>
				<div className='h-px w-12 bg-border sm:w-16' />
				<div className='flex items-center gap-2 opacity-30'>
					<div className='flex size-8 items-center justify-center rounded-full border-2 border-border text-sm font-semibold text-muted-foreground'>
						3
					</div>
					<span className='hidden text-sm text-muted-foreground sm:inline'>
						Complete
					</span>
				</div>
			</div>

			{/* Failure Header */}
			<div className='flex flex-col items-center gap-4 text-center'>
				<div className='flex size-16 items-center justify-center rounded-full bg-destructive/10'>
					<XCircle className='size-8 text-destructive' />
				</div>

				<div>
					<h1 className='font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
						Payment Failed
					</h1>
					<p className='mt-2 text-lg text-muted-foreground'>
						Don&apos;t worry — no charges were made to your account
					</p>
				</div>
			</div>

			{/* Error Alert */}
			{error && (
				<Alert variant='destructive' className='mt-6'>
					<AlertCircle className='size-4' />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Failure Reasons */}
			<Card className='mt-8'>
				<CardContent className='pt-6'>
					<h2 className='mb-4 font-serif text-lg font-semibold text-foreground'>
						Common reasons for payment failure
					</h2>
					<div className='space-y-4'>
						{failureReasons.map((reason) => {
							const Icon = reason.icon
							return (
								<div key={reason.title} className='flex gap-3'>
									<div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted'>
										<Icon className='size-5 text-muted-foreground' />
									</div>
									<div>
										<p className='font-medium text-foreground'>
											{reason.title}
										</p>
										<p className='text-sm text-muted-foreground'>
											{reason.description}
										</p>
									</div>
								</div>
							)
						})}
					</div>
				</CardContent>
			</Card>

			{/* Help Text */}
			<Card className='mt-6 border-primary/20 bg-primary/5'>
				<CardContent className='pt-6'>
					<div className='flex gap-3'>
						<ShoppingBag className='mt-0.5 size-5 shrink-0 text-primary' />
						<div>
							<p className='font-medium text-foreground'>
								Your cart has been saved
							</p>
							<p className='mt-1 text-sm text-muted-foreground'>
								All items are still in your cart. You can try again with a
								different payment method or contact our support team for
								assistance.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* CTAs */}
			<div className='mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center'>
				<Button asChild size='lg' className='text-base font-semibold'>
					<Link href='/cart'>
						<RefreshCcw className='mr-1.5 size-4' />
						Try Again
					</Link>
				</Button>
				<Button
					asChild
					variant='outline'
					size='lg'
					className='text-base font-semibold'
				>
					<Link href='/contact'>
						<MessageCircle className='mr-1.5 size-4' />
						Contact Support
					</Link>
				</Button>
			</div>

			{/* Alternative Action */}
			<div className='mt-6 text-center'>
				<Button asChild variant='ghost' size='sm'>
					<Link href='/shop'>
						<ShoppingBag className='mr-1.5 size-4' />
						Continue Shopping
					</Link>
				</Button>
			</div>
		</section>
	)
}

export default function CheckoutFailurePage() {
	return (
		<Suspense>
			<FailureContent />
		</Suspense>
	)
}
