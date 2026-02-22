import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/actions/auth";
import type { Order, OrderStatus } from "@/types/database";
import { normalizeOrder } from "@/lib/normalize";
import { formatPrice as formatCurrency, formatDate } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "My Account — Jirah Shop",
  };
}

function statusVariant(
  status: OrderStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "paid":
    case "delivered":
      return "default";
    case "shipped":
      return "secondary";
    case "pending":
      return "outline";
    case "cancelled":
    case "refunded":
      return "destructive";
    default:
      return "outline";
  }
}

function statusLabel(status: OrderStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account");
  }

  // Fetch customer orders
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const typedOrders = (orders ?? []).map((o) => normalizeOrder(o as Record<string, unknown>));

  const displayName =
    user.user_metadata?.full_name ?? user.email ?? "Customer";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
          My Account
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your profile and view your orders
        </p>
      </div>

      {/* Profile Card */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-serif text-xl">Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </div>
            <form action={signOut}>
              <Button variant="outline" size="sm" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Name
              </dt>
              <dd className="mt-1 text-foreground">{displayName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Email
              </dt>
              <dd className="mt-1 text-foreground">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Member since
              </dt>
              <dd className="mt-1 text-foreground">
                {formatDate(user.created_at)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Order History</CardTitle>
          <CardDescription>
            {typedOrders.length === 0
              ? "You haven't placed any orders yet."
              : `You have ${typedOrders.length} order${typedOrders.length === 1 ? "" : "s"}.`}
          </CardDescription>
        </CardHeader>

        {typedOrders.length > 0 && (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(order.status)}>
                        {statusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
