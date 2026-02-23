import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { User, Store, ChevronRight } from "lucide-react";

export default function AgentsPage() {
  return (
    <div className="p-4 pb-24">
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

      <Link
        href="/agent/marketplace"
        className="flex items-center justify-between gap-3 p-4 rounded-xl border-2 border-[#10B981]/30 bg-[#10B981]/5 hover:bg-[#10B981]/10 transition-colors tap-target"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10B981]/20 text-[#10B981]">
            <Store className="h-6 w-6" aria-hidden />
          </div>
          <div className="text-left">
            <p className="font-semibold text-[#0F172A]">Browse Marketplace</p>
            <p className="text-sm text-slate-600">
              Find properties open for agents
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-[#10B981] shrink-0" aria-hidden />
      </Link>
    </div>
  );
}
