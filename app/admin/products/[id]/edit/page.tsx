import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminProduct } from "@/actions/admin-products";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await getAdminProduct(id);

  if (!result) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Edit Product</h1>
        <p className="text-sm text-muted-foreground">
          Update {result.product.name}
        </p>
      </div>

      <ProductForm product={result.product} variants={result.variants} />
    </div>
  );
}
