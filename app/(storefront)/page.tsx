import Image from 'next/image'
import Link from 'next/link'
import {
	ArrowRight,
	Sparkles,
	Truck,
	ShieldCheck,
	Leaf,
	Droplets,
	Palette,
	Scissors,
	Heart,
	Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cachedGetFeaturedProducts } from '@/lib/cached-queries'
import { ProductCard } from '@/components/storefront/product-card'
import { CATEGORIES } from '@/lib/constants'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
	skincare: Droplets,
	makeup: Palette,
	hair: Scissors,
	body: Heart,
	tools: Wand2,
}

export default async function HomePage() {
	const featured = await cachedGetFeaturedProducts()

	return (
		<>
			{/* ═══════════════════════════════════════════════ */}
			{/* HERO SECTION */}
			{/* ═══════════════════════════════════════════════ */}
			<section className='relative overflow-hidden bg-linear-to-br/oklch from-primary/5 via-background to-secondary/30'>
				<div className='mx-auto flex max-w-7xl flex-col items-center gap-8 px-6 py-20 text-center sm:py-28 lg:py-36'>
					<p className='flex items-center gap-1.5 text-xs font-medium uppercase tracking-luxury text-primary'>
						<Sparkles className='size-3.5' />
						Asian Beauty, Curated for You
					</p>

					<h1 className='mx-auto max-w-4xl font-serif text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl xl:text-7xl'>
						Discover Your
						<span className='text-primary'> Radiant </span>
						Beauty
					</h1>

					<p className='mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl lg:text-[1.35rem] lg:leading-relaxed'>
						Premium K-beauty, J-beauty, and Asian skincare — own-brand
						formulations and expertly curated picks for every skin type.
					</p>

					<div className='flex flex-col gap-3 sm:flex-row'>
						<Button asChild size='lg' className='text-base font-semibold'>
							<Link href='/shop'>
								Shop Collection
								<ArrowRight className='ml-1.5 size-4' />
							</Link>
						</Button>
						<Button
							asChild
							variant='outline'
							size='lg'
							className='text-base font-semibold'
						>
							<Link href='/about'>Our Story</Link>
						</Button>
					</div>
				</div>

				{/* Decorative gradient orbs */}
				<div className='pointer-events-none absolute -top-40 left-1/2 size-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl' />
				<div className='pointer-events-none absolute -bottom-20 right-0 size-60 rounded-full bg-accent/10 blur-3xl' />
			</section>

			{/* ═══════════════════════════════════════════════ */}
			{/* TRUST BAR */}
			{/* ═══════════════════════════════════════════════ */}
			<section className='border-y bg-card/50'>
				<div className='mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-8 px-6 py-5 sm:gap-12'>
					{[
						{ icon: Truck, text: 'Free Shipping $50+' },
						{ icon: ShieldCheck, text: 'Authentic Products' },
						{ icon: Leaf, text: 'Clean Beauty' },
						{ icon: Sparkles, text: 'K-Beauty Experts' },
					].map(({ icon: Icon, text }) => (
						<div
							key={text}
							className='flex items-center gap-2 text-sm font-medium text-muted-foreground'
						>
							<Icon className='size-4 text-primary' />
							{text}
						</div>
					))}
				</div>
			</section>

			{/* ═══════════════════════════════════════════════ */}
			{/* CATEGORY CARDS */}
			{/* ═══════════════════════════════════════════════ */}
			<section className='mx-auto max-w-7xl px-6 py-20 sm:py-24'>
				<div className='mb-12 text-center'>
					<h2 className='font-serif text-3xl font-bold text-foreground sm:text-4xl'>
						Shop by Category
					</h2>
					<p className='mt-3 text-base text-muted-foreground sm:text-lg'>
						Find exactly what your skin craves
					</p>
				</div>

				<div className='grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3'>
					{CATEGORIES.map((cat, index) => {
						const Icon = CATEGORY_ICONS[cat.value] ?? Sparkles
						const isHero = index === 0

						return (
							<Link
								key={cat.value}
								href={`/shop/${cat.value}`}
								className={`group relative overflow-hidden rounded-2xl ${
									isHero
										? 'col-span-2 row-span-2 lg:col-span-2 lg:row-span-2'
										: 'col-span-1'
								}`}
							>
								{/* Background Image */}
								<div
									className={`relative w-full ${isHero ? 'aspect-4/3 sm:aspect-3/2 lg:aspect-auto lg:h-full min-h-[280px]' : 'aspect-4/3'}`}
								>
									<Image
										src={cat.image}
										alt={cat.label}
										fill
										sizes={
											isHero
												? '(max-width: 768px) 100vw, 66vw'
												: '(max-width: 768px) 50vw, 33vw'
										}
										className='object-cover transition-transform duration-500 group-hover:scale-105'
									/>

									{/* Gradient Overlay */}
									<div className='absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent transition-colors duration-300 group-hover:from-black/60' />

									{/* Content */}
									<div className='absolute inset-0 flex flex-col justify-end p-5 sm:p-6'>
										<div className='flex items-center gap-2.5'>
											<div className='flex size-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm transition-colors duration-300 group-hover:bg-primary/80'>
												<Icon className='size-4.5 text-white' />
											</div>
											<div>
												<h3 className='font-serif text-base font-semibold text-white sm:text-lg'>
													{cat.label}
												</h3>
											</div>
										</div>
										<p className='mt-1.5 text-xs leading-relaxed text-white/80 line-clamp-2 sm:text-sm'>
											{cat.description}
										</p>
									</div>
								</div>
							</Link>
						)
					})}
				</div>
			</section>

			{/* ═══════════════════════════════════════════════ */}
			{/* FEATURED PRODUCTS */}
			{/* ═══════════════════════════════════════════════ */}
			{featured.length > 0 && (
				<section className='bg-secondary/20 py-20 sm:py-24'>
					<div className='mx-auto max-w-7xl px-6'>
						<div className='mb-12 flex items-end justify-between'>
							<div>
								<h2 className='font-serif text-3xl font-bold text-foreground sm:text-4xl'>
									Featured Picks
								</h2>
								<p className='mt-3 text-base text-muted-foreground sm:text-lg'>
									Our most-loved products, handpicked for you
								</p>
							</div>
							<Button asChild variant='ghost' className='hidden sm:inline-flex'>
								<Link href='/shop'>
									View All
									<ArrowRight className='ml-1 size-4' />
								</Link>
							</Button>
						</div>

						<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
							{featured.slice(0, 8).map((product) => (
								<ProductCard key={product.id} product={product} />
							))}
						</div>

						<div className='mt-8 text-center sm:hidden'>
							<Button asChild variant='outline'>
								<Link href='/shop'>
									View All Products
									<ArrowRight className='ml-1 size-4' />
								</Link>
							</Button>
						</div>
					</div>
				</section>
			)}

			{/* ═══════════════════════════════════════════════ */}
			{/* BRAND STORY TEASER */}
			{/* ═══════════════════════════════════════════════ */}
			<section className='mx-auto max-w-7xl px-6 py-20 sm:py-24'>
				<div className='grid gap-10 rounded-3xl bg-linear-to-br/oklch from-primary/5 via-card to-accent/5 p-8 sm:p-12 lg:grid-cols-2 lg:gap-20 lg:p-16'>
					<div className='flex flex-col justify-center'>
						<p className='mb-5 flex w-fit items-center gap-1.5 text-xs font-medium uppercase tracking-luxury text-primary'>
							<Leaf className='size-3' />
							Our Story
						</p>
						<h2 className='font-serif text-3xl font-bold text-foreground sm:text-4xl'>
							Beauty Rooted in Heritage
						</h2>
						<p className='mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed'>
							Jirah Pigte was born from a passion for Asian beauty rituals
							passed down through generations. We blend time-honored ingredients
							with modern innovation to create products that celebrate every
							skin tone, type, and story.
						</p>
						<Button asChild variant='outline' className='mt-6 w-fit'>
							<Link href='/about'>
								Learn More
								<ArrowRight className='ml-1 size-4' />
							</Link>
						</Button>
					</div>

					<div className='relative aspect-square overflow-hidden rounded-2xl'>
						<Image
							src='https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&q=80&fit=crop&auto=format'
							alt='Asian beauty skincare ritual'
							fill
							className='object-cover'
							sizes='(max-width: 768px) 100vw, 50vw'
						/>
					</div>
				</div>
			</section>
		</>
	)
}
