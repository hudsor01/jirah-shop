import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getAdminOrder } from "@/actions/orders";
import { OrderStatusUpdater } from "./order-status-updater";
import type { OrderStatus } from "@/types/database";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-gray-100 text-gray-800 border-gray-200",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await getAdminOrder(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-semibold">Order Details</h1>
          <p className="font-mono text-sm text-muted-foreground">
            {order.id}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`text-sm ${STATUS_STYLES[order.status]}`}
        >
          {order.status}
        </Badge>
      </div>

      {/* Status update */}
      <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />

      {/* Order summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-sm">
              Customer Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Email: </span>
              {order.email}
            </div>
            {order.user_id && (
              <div>
                <span className="text-muted-foreground">User ID: </span>
                <span className="font-mono text-xs">
                  {order.user_id.slice(0, 8)}...
                </span>
              </div>
            )}
            {order.coupon_code && (
              <div>
                <span className="text-muted-foreground">Coupon: </span>
                <Badge variant="secondary" className="font-mono">
                  {order.coupon_code}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-sm">
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {order.shipping_address ? (
              <>
                <p className="font-medium">{order.shipping_address.name}</p>
                <p>{order.shipping_address.line1}</p>
                {order.shipping_address.line2 && (
                  <p>{order.shipping_address.line2}</p>
                )}
                <p>
                  {order.shipping_address.city},{" "}
                  {order.shipping_address.state}{" "}
                  {order.shipping_address.postal_code}
                </p>
                <p>{order.shipping_address.country}</p>
              </>
            ) : (
              <p className="text-muted-foreground">No address provided</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order items */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-sm">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-xs text-muted-foreground">
                        {item.variant_name}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    ${item.unit_price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${item.total_price.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>${order.shipping_cost.toFixed(2)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-${order.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment info */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-sm">
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {order.stripe_payment_intent_id && (
            <div>
              <span className="text-muted-foreground">
                Payment Intent:{" "}
              </span>
              <span className="font-mono text-xs">
                {order.stripe_payment_intent_id}
              </span>
            </div>
          )}
          {order.stripe_checkout_session_id && (
            <div>
              <span className="text-muted-foreground">
                Checkout Session:{" "}
              </span>
              <span className="font-mono text-xs">
                {order.stripe_checkout_session_id}
              </span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Created: </span>
            {new Date(order.created_at).toLocaleString()}
          </div>
          <div>
            <span className="text-muted-foreground">Updated: </span>
            {new Date(order.updated_at).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
