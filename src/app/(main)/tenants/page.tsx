import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Home } from "lucide-react";

export default function TenantsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">
        Tenants
      </h1>
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Home</CardTitle>
            <Badge variant="success">Current</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-white/80">
            <Home className="h-8 w-8" aria-hidden />
            <p className="text-sm">
              View your lease, pay rent, and submit maintenance requests.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
