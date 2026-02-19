import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AddPropertyPage() {
  return (
    <div className="min-h-full bg-slate-50 p-4">
      <Link
        href="/owner/properties"
        className="inline-flex items-center gap-2 text-[#0F172A] hover:text-[#10B981] mb-6"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back
      </Link>
      <h1 className="text-2xl font-bold text-[#0F172A]">Add property</h1>
      <p className="text-slate-500 text-sm mt-2">
        Add property form coming soon.
      </p>
    </div>
  );
}
