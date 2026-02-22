import type { Metadata } from 'next'
import Link from 'next/link'
import {
	CheckCircle,
	Package,
	ArrowRight,
	ShoppingBag,
	Mail,
	Sparkles,
	Heart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { stripe } from '@/lib/stripe'
import { ClearCartOnSuccess } from './clear-cart'

export const metadata: Metadata = {
	title: 'Order Confirmed',
	description: 'Thank you for your purchase at Jirah Shop.',
}

export default async function CheckoutSuccessPage({
	searchParams,
}: {
	searchParams: Promise<{ session_id?: string }>
}) {
	const { session_id } = await searchParams

	if (!session_id) {
		return (
			<section className='mx-auto flex max-w-lg flex-col items-center gap-6 px-6 py-20 text-center'>
				<h1 className='font-serif text-2xl font-bold text-foreground'>
					No Order Found
				</h1>
				<p className='text-muted-foreground'>
					We couldn&apos;t find an order. If you placed an order, please check
					your email for confirmation.
				</p>
				<Button asChild>
					<Link href='/shop'>
						Continue Shopping
						<ArrowRight className='ml-1.5 size-4' />
					</Link>
				</Button>
			</section>
		)
	}

	// Fetch session from Stripe
	let session
	try {
		session = await stripe.checkout.sessions.retrieve(session_id, {
			expand: ['line_items'],
		})
	} catch {
		return (
			<section className='mx-auto flex max-w-lg flex-col items-center gap-6 px-6 py-20 text-center'>
				<h1 className='font-serif text-2xl font-bold text-foreground'>
					Order Not Found
				</h1>
				<p className='text-muted-foreground'>
					We couldn&apos;t retrieve your order details. Please check your email
					for the receipt.
				</p>
				<Button asChild>
					<Link href='/shop'>
						Continue Shopping
						<ArrowRight className='ml-1.5 size-4' />
					</Link>
				</Button>
			</section>
		)
	}

	const lineItems = session.line_items?.data ?? []
	const amountTotal = (session.amount_total ?? 0) / 100
	const customerEmail = session.customer_details?.email ?? 'your email address'

	return (
		<section className='mx-auto max-w-2xl px-6 py-12 sm:py-20'>
			{/* Clear cart on successful checkout — idempotent via sessionStorage */}
			<ClearCartOnSuccess sessionId={session_id} />

			{/* Progress Indicator */}
			<div className='mb-8 flex items-center justify-center gap-2'>
				<div className='flex items-center gap-2 opacity-50'>
					<div className='flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground'>
						✓
					</div>
					<span className='hidden text-sm font-medium sm:inline'>Cart</span>
				</div>
				<div className='h-px w-12 bg-border sm:w-16' />
				<div className='flex items-center gap-2 opacity-50'>
					<div className='flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground'>
						✓
					</div>
					<span className='hidden text-sm font-medium sm:inline'>Checkout</span>
				</div>
				<div className='h-px w-12 bg-border sm:w-16' />
				<div className='flex items-center gap-2'>
					<div className='flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground'>
						3
					</div>
					<span className='hidden text-sm font-medium sm:inline'>Complete</span>
				</div>
			</div>

			{/* Success Header with Animation */}
			<div className='flex flex-col items-center gap-4 text-center'>
				<div className='relative flex size-20 items-center justify-center'>
					<div className='absolute inset-0 animate-ping rounded-full bg-primary/20' />
					<div className='relative flex size-16 items-center justify-center rounded-full bg-primary/10'>
						<CheckCircle className='size-8 text-primary' />
					</div>
				</div>

				<div>
					<h1 className='font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
						Order Confirmed!
					</h1>
					<p className='mt-2 text-lg text-muted-foreground'>
						Thank you for your purchase
					</p>
				</div>

				<Badge
					variant='secondary'
					className='flex items-center gap-1.5 px-3 py-1'
				>
					<Package className='size-3.5' />
					<span className='text-sm font-medium'>
						Order #{session_id.slice(-8).toUpperCase()}
					</span>
				</Badge>
			</div>

			{/* Order Summary */}
			<Card className='mt-10'>
				<CardHeader>
					<CardTitle className='font-serif text-xl'>Order Summary</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					{lineItems.map((item) => (
						<div key={item.id} className='flex justify-between text-sm'>
							<span className='text-foreground'>
								{item.description}
								{(item.quantity ?? 1) > 1 && (
									<span className='ml-1 text-muted-foreground'>
										× {item.quantity}
									</span>
								)}
							</span>
							<span className='font-medium'>
								${((item.amount_total ?? 0) / 100).toFixed(2)}
							</span>
						</div>
					))}

					<Separator />

					<div className='flex justify-between text-lg font-semibold'>
						<span>Total Paid</span>
						<span className='text-primary'>${amountTotal.toFixed(2)}</span>
					</div>
				</CardContent>
			</Card>

			{/* What's Next */}
			<Card className='mt-6 border-primary/20 bg-primary/5'>
				<CardContent className='pt-6'>
					<h3 className='mb-4 flex items-center gap-2 font-serif text-lg font-semibold'>
						<Sparkles className='size-5 text-primary' />
						What happens next?
					</h3>
					<div className='space-y-3 text-sm text-muted-foreground'>
						<div className='flex gap-3'>
							<Mail className='mt-0.5 size-4 shrink-0 text-primary' />
							<div>
								<p className='font-medium text-foreground'>
									Confirmation email sent
								</p>
								<p>
									Check <span className='font-medium'>{customerEmail}</span> for
									your order details and receipt
								</p>
							</div>
						</div>
						<div className='flex gap-3'>
							<Package className='mt-0.5 size-4 shrink-0 text-primary' />
							<div>
								<p className='font-medium text-foreground'>Order processing</p>
								<p>
									We&apos;ll prepare your items and send tracking info within
									1-2 business days
								</p>
							</div>
						</div>
						<div className='flex gap-3'>
							<Heart className='mt-0.5 size-4 shrink-0 text-primary' />
							<div>
								<p className='font-medium text-foreground'>Track your order</p>
								<p>
									View order status and tracking details in your account
									dashboard
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* CTAs */}
			<div className='mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center'>
				<Button asChild size='lg' className='text-base font-semibold'>
					<Link href='/account'>
						View Order Status
						<ArrowRight className='ml-1.5 size-4' />
					</Link>
				</Button>
				<Button
					asChild
					variant='outline'
					size='lg'
					className='text-base font-semibold'
				>
					<Link href='/shop'>
						<ShoppingBag className='mr-1.5 size-4' />
						Continue Shopping
					</Link>
				</Button>
			</div>

			{/* Social Proof / Loyalty */}
			<div className='mt-8 rounded-2xl border bg-linear-to-br from-primary/5 to-primary/10 p-6 text-center'>
				<p className='text-sm font-medium text-foreground'>
					🎉 You&apos;re part of our beauty community!
				</p>
				<p className='mt-1 text-xs text-muted-foreground'>
					Follow us on social media for exclusive tips, early access to new
					products, and special offers
				</p>
			</div>
		</section>
	)
}
