import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { User } from "lucide-react";

export default function AgentsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-6">
        Agents
      </h1>
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Agent Dashboard</CardTitle>
            <Badge variant="success">Ready</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-white/80">
            <User className="h-8 w-8" aria-hidden />
            <p className="text-sm">
              Manage listings, coordinate viewings, and support tenants.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
