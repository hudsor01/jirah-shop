'use client'

import { useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
	Minus,
	Plus,
	Trash2,
	ShoppingBag,
	ArrowRight,
	ArrowLeft,
	Loader2,
	Lock,
	Truck,
	RotateCcw,
	Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCart } from '@/providers/cart-provider'
import { createCheckoutSession } from '@/actions/checkout'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function CartPage() {
	const {
		items,
		itemCount,
		subtotal,
		shippingCost,
		freeShippingThreshold,
		total,
		couponCode,
		removeItem,
		updateQuantity,
		clearCart,
	} = useCart()
	const [isPending, startTransition] = useTransition()

	function handleCheckout() {
		startTransition(async () => {
			try {
				const { url } = await createCheckoutSession(items, couponCode)
				if (url) {
					window.location.href = url
				}
			} catch (error) {
				toast.error('Checkout failed. Please try again.', {
					description:
						error instanceof Error ? error.message : 'Something went wrong',
				})
			}
		})
	}

	const amountUntilFreeShipping = freeShippingThreshold - subtotal
	const shippingProgress = Math.min(
		(subtotal / freeShippingThreshold) * 100,
		100,
	)

	if (items.length === 0) {
		return (
			<section className='mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-20 text-center'>
				<div className='flex size-20 items-center justify-center rounded-full bg-muted'>
					<ShoppingBag className='size-10 text-muted-foreground/50' />
				</div>
				<div>
					<h1 className='font-serif text-3xl font-bold tracking-tight text-foreground'>
						Your Cart is Empty
					</h1>
					<p className='mt-2 text-muted-foreground'>
						Looks like you haven&apos;t added anything yet. Explore our
						collection to find your next beauty favorite.
					</p>
				</div>
				<Button asChild size='lg' className='text-base font-semibold'>
					<Link href='/shop'>
						Start Shopping
						<ArrowRight className='ml-1.5 size-4' />
					</Link>
				</Button>
			</section>
		)
	}

	return (
		<section className='mx-auto max-w-7xl px-6 py-10 sm:py-16'>
			{/* Progress Indicator */}
			<div className='mb-8 flex items-center justify-center gap-2'>
				<div className='flex items-center gap-2'>
					<div className='flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground'>
						1
					</div>
					<span className='text-sm font-medium'>Cart</span>
				</div>
				<div className='h-px w-12 bg-border sm:w-16' />
				<div className='flex items-center gap-2'>
					<div className='flex size-8 items-center justify-center rounded-full border-2 border-border text-sm font-semibold text-muted-foreground'>
						2
					</div>
					<span className='hidden text-sm text-muted-foreground sm:inline'>
						Checkout
					</span>
				</div>
				<div className='h-px w-12 bg-border sm:w-16' />
				<div className='flex items-center gap-2'>
					<div className='flex size-8 items-center justify-center rounded-full border-2 border-border text-sm font-semibold text-muted-foreground'>
						3
					</div>
					<span className='hidden text-sm text-muted-foreground sm:inline'>
						Complete
					</span>
				</div>
			</div>

			<h1 className='font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>
				Shopping Cart
			</h1>
			<p className='mt-2 text-muted-foreground'>
				{itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
			</p>

			<div className='mt-8 grid gap-8 lg:grid-cols-3'>
				{/* Cart Items */}
				<div className='lg:col-span-2'>
					{/* Free shipping progress bar */}
					{amountUntilFreeShipping > 0 ? (
						<div className='mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4'>
							<div className='mb-2 flex items-center justify-between text-sm'>
								<span className='font-medium text-primary'>
									<Truck className='mr-1 inline size-4' />
									Add ${amountUntilFreeShipping.toFixed(2)} more for free
									shipping!
								</span>
								<span className='text-xs text-primary/70'>
									{Math.round(shippingProgress)}%
								</span>
							</div>
							<div className='h-2 overflow-hidden rounded-full bg-primary/10'>
								<div
									className='h-full rounded-full bg-primary transition-all duration-300'
									style={{ width: `${shippingProgress}%` }}
								/>
							</div>
						</div>
					) : (
						<div className='mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5'>
							<Truck className='size-4 text-primary' />
							<span className='text-sm font-medium text-primary'>
								✨ You qualify for free shipping!
							</span>
						</div>
					)}

					<div className='space-y-4'>
						{items.map((item) => {
							const key = `${item.product_id}::${item.variant_id ?? ''}`
							return (
								<div
									key={key}
									className='flex gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5'
								>
									{/* Product image */}
									<div className='relative size-24 shrink-0 overflow-hidden rounded-xl border bg-muted sm:size-28'>
										{item.image ? (
											<Image
												src={item.image}
												alt={item.name}
												fill
												className='object-cover'
												sizes='112px'
											/>
										) : (
											<div className='flex size-full items-center justify-center text-xs text-muted-foreground'>
												No image
											</div>
										)}
									</div>

									{/* Product details */}
									<div className='flex flex-1 flex-col justify-between'>
										<div>
											<h3 className='font-serif text-base font-semibold text-card-foreground sm:text-lg'>
												{item.name}
											</h3>
											{item.variant_name && (
												<p className='mt-0.5 text-sm text-muted-foreground'>
													{item.variant_name}
												</p>
											)}
											<p className='mt-1 text-sm font-medium text-primary'>
												${item.price.toFixed(2)}
											</p>
										</div>

										<div className='mt-3 flex items-center justify-between'>
											{/* Quantity controls */}
											<div className='flex items-center gap-2'>
												<Button
													variant='outline'
													size='icon'
													className='size-8'
													onClick={() =>
														updateQuantity(
															item.product_id,
															item.variant_id,
															item.quantity - 1,
														)
													}
													disabled={item.quantity <= 1}
												>
													<Minus className='size-3.5' />
													<span className='sr-only'>Decrease quantity</span>
												</Button>
												<span className='w-8 text-center text-sm font-medium tabular-nums'>
													{item.quantity}
												</span>
												<Button
													variant='outline'
													size='icon'
													className='size-8'
													onClick={() =>
														updateQuantity(
															item.product_id,
															item.variant_id,
															item.quantity + 1,
														)
													}
												>
													<Plus className='size-3.5' />
													<span className='sr-only'>Increase quantity</span>
												</Button>
											</div>

											<div className='flex items-center gap-3'>
												<p className='font-medium'>
													${(item.price * item.quantity).toFixed(2)}
												</p>
												<Button
													variant='ghost'
													size='icon'
													className='size-8 text-muted-foreground hover:text-destructive'
													onClick={() =>
														removeItem(item.product_id, item.variant_id)
													}
												>
													<Trash2 className='size-4' />
													<span className='sr-only'>Remove</span>
												</Button>
											</div>
										</div>
									</div>
								</div>
							)
						})}
					</div>

					{/* Continue shopping + clear */}
					<div className='mt-6 flex items-center justify-between'>
						<Button asChild variant='ghost'>
							<Link href='/shop'>
								<ArrowLeft className='mr-1.5 size-4' />
								Continue Shopping
							</Link>
						</Button>
						<Button
							variant='outline'
							size='sm'
							className='text-muted-foreground'
							onClick={clearCart}
						>
							Clear Cart
						</Button>
					</div>
				</div>

				{/* Order Summary */}
				<div className='lg:col-span-1'>
					<Card className='sticky top-24'>
						<CardHeader>
							<CardTitle className='font-serif text-xl'>
								Order Summary
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='flex justify-between text-sm'>
								<span className='text-muted-foreground'>
									Subtotal ({itemCount} items)
								</span>
								<span className='font-medium'>${subtotal.toFixed(2)}</span>
							</div>
							<div className='flex justify-between text-sm'>
								<span className='text-muted-foreground'>Shipping</span>
								<span className='font-medium'>
									{shippingCost === 0 ? (
										<Badge variant='secondary' className='font-normal'>
											Free
										</Badge>
									) : (
										`$${shippingCost.toFixed(2)}`
									)}
								</span>
							</div>
							<Separator />
							<div className='flex justify-between text-lg font-semibold'>
								<span>Total</span>
								<span>${total.toFixed(2)}</span>
							</div>

							{/* Trust badges */}
							<div className='space-y-2 border-t pt-4'>
								<div className='flex items-center gap-2 text-xs text-muted-foreground'>
									<Lock className='size-3.5 text-primary' />
									<span>Secure checkout with Stripe</span>
								</div>
								<div className='flex items-center gap-2 text-xs text-muted-foreground'>
									<RotateCcw className='size-3.5 text-primary' />
									<span>30-day return policy</span>
								</div>
								<div className='flex items-center gap-2 text-xs text-muted-foreground'>
									<Shield className='size-3.5 text-primary' />
									<span>100% authentic products</span>
								</div>
							</div>
						</CardContent>
						<CardFooter className='flex-col gap-3'>
							<Button
								className='w-full'
								size='lg'
								onClick={handleCheckout}
								disabled={isPending}
							>
								{isPending ? (
									<>
										<Loader2 className='mr-2 size-4 animate-spin' />
										Redirecting to Checkout...
									</>
								) : (
									<>
										<Lock className='mr-2 size-4' />
										Secure Checkout
										<ArrowRight className='ml-1.5 size-4' />
									</>
								)}
							</Button>
							<p className='text-center text-xs text-muted-foreground'>
								Powered by <span className='font-medium'>Stripe</span> • Secure
								& encrypted
							</p>
						</CardFooter>
					</Card>
				</div>
			</div>
		</section>
	)
}
