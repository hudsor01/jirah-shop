import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getSalesData } from "@/actions/orders";
import { SalesChart } from "@/components/admin/sales-chart";

export default async function AdminAnalyticsPage() {
  const [result30, result7, result90] = await Promise.all([
    getSalesData(30),
    getSalesData(7),
    getSalesData(90),
  ]);

  const salesData30 = result30.success ? result30.data : [];
  const salesData7 = result7.success ? result7.data : [];
  const salesData90 = result90.success ? result90.data : [];

  const totalRevenue30 = salesData30.reduce((s, d) => s + d.revenue, 0);
  const totalOrders30 = salesData30.reduce((s, d) => s + d.orders, 0);
  const avgOrderValue = totalOrders30 > 0 ? totalRevenue30 / totalOrders30 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Sales performance and trends
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-sm font-medium text-muted-foreground">
              Revenue (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalRevenue30.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-sm font-medium text-muted-foreground">
              Orders (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders30}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-sm font-medium text-muted-foreground">
              Avg. Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${avgOrderValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">
            Revenue Over Time
          </CardTitle>
          <CardDescription>Daily revenue breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="30">
            <TabsList>
              <TabsTrigger value="7">7 days</TabsTrigger>
              <TabsTrigger value="30">30 days</TabsTrigger>
              <TabsTrigger value="90">90 days</TabsTrigger>
            </TabsList>
            <TabsContent value="7" className="mt-4">
              <SalesChart data={salesData7} />
            </TabsContent>
            <TabsContent value="30" className="mt-4">
              <SalesChart data={salesData30} />
            </TabsContent>
            <TabsContent value="90" className="mt-4">
              <SalesChart data={salesData90} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
