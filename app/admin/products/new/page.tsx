import { ProductForm } from '@/components/admin/product-form'

export default function NewProductPage() {
	return (
		<div className='mx-auto max-w-3xl space-y-6'>
			<div>
				<h1 className='font-serif text-2xl font-semibold'>Create Product</h1>
				<p className='text-sm text-muted-foreground'>
					Add a new product to your catalog
				</p>
			</div>

			<ProductForm />
		</div>
	)
}
