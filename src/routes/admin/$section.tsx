import { createFileRoute, Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SECTION_LABELS } from "@/components/admin/nav-items";
import { UsersModule } from "@/components/admin/UsersModule";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/admin/$section")({
  head: ({ params }) => {
    const label = SECTION_LABELS[params.section] ?? "Admin Module";
    const title = `${label} | PGx Registry Admin`;
    const description = `${label} module of the Pharmacogenomics Database Management System administration console.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: SectionPage,
});

function SectionPage() {
  const { section } = Route.useParams();
  const label = SECTION_LABELS[section] ?? "Admin Module";

  if (section === "users") {
    return (
      <AdminLayout
        title={label}
        subtitle="Create, edit and manage accounts in the live database"
        activeLabel={label}
      >
        <UsersModule />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={label}
      subtitle="Module scheduled for a later phase"
      activeLabel={label}
    >
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <Construction className="size-6" />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{label}</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              This module is a navigation placeholder in the current phase. The Dashboard and User
              Management are fully functional and wired to the admin API.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
