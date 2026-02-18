import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Building2 } from "lucide-react";

export default function OwnersPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">
        Asset Owners
      </h1>
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Portfolio</CardTitle>
            <Badge variant="success">Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-white/80">
            <Building2 className="h-8 w-8" aria-hidden />
            <p className="text-sm">
              Manage your properties, view analytics, and track rental income.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
