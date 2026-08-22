import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserRound,
  Stethoscope,
  Pill,
  Dna,
  GitBranch,
  ClipboardList,
  FileText,
  AlertTriangle,
  BookOpen,
  Database,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getDashboardData,
  isApiConfigured,
  type CountItem,
  type RecommendationRow,
} from "@/lib/admin-api";

const title = "Admin Dashboard | PGx Registry";
const description =
  "Administration console for the Pharmacogenomics Database Management System: drug-gene interaction analytics, genetic variant records and clinical recommendations.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDashboard,
});

const nf = new Intl.NumberFormat("en-US");

const TYPE_COLORS: Record<string, string> = {
  Recommended: "var(--chart-2)",
  Avoid: "var(--chart-5)",
  "Dose Adjustment": "var(--chart-4)",
  Alternative: "var(--chart-1)",
};

function AdminDashboard() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getDashboardData,
  });

  const statCards = [
    { label: "Total Users", value: data?.stats.users, icon: Users },
    { label: "Total Patients", value: data?.stats.patients, icon: UserRound },
    { label: "Total Doctors", value: data?.stats.doctors, icon: Stethoscope },
    { label: "Total Drugs", value: data?.stats.drugs, icon: Pill },
    { label: "Total Genes", value: data?.stats.genes, icon: Dna },
    { label: "Genetic Variants", value: data?.stats.variants, icon: GitBranch },
    { label: "Recommendations", value: data?.stats.recommendations, icon: ClipboardList },
    { label: "Prescriptions", value: data?.stats.prescriptions, icon: FileText },
  ];

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Pharmacogenomics Database Management System"
      activeLabel="Dashboard"
    >
      <div className="space-y-6">
        {/* Data source banner */}
        {!isPending && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
            <Database className="size-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {data?.source === "api"
                ? "Live data from the pharmacogenomics API."
                : "Development data — the MySQL-backed admin API is not connected yet."}
            </p>
            <Badge
              variant={data?.source === "api" ? "default" : "secondary"}
              className="ml-auto"
            >
              {data?.source === "api" ? "Live" : "Mock / fallback"}
            </Badge>
            {!isApiConfigured() && (
              <span className="text-[11px] text-muted-foreground">
                set VITE_ADMIN_API_URL to switch
              </span>
            )}
          </div>
        )}

        {isError && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4" />
            <span>
              Failed to load dashboard data: {error instanceof Error ? error.message : "unknown"}
            </span>
          </div>
        )}

        {/* Statistics */}
        <section>
          <SectionTitle>Database statistics</SectionTitle>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {statCards.map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="flex items-start gap-3 py-5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    {isPending ? (
                      <Skeleton className="mt-2 h-6 w-16" />
                    ) : (
                      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                        {nf.format(value ?? 0)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Analytics */}
        <section className="space-y-4">
          <SectionTitle>Analytics</SectionTitle>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recommendations by type</CardTitle>
              <CardDescription>
                Distribution of clinical recommendation categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {data!.recommendationsByType.map((item) => (
                    <div
                      key={item.name}
                      className="rounded-lg border border-border p-4"
                      style={{ borderLeft: `3px solid ${TYPE_COLORS[item.name] ?? "var(--chart-3)"}` }}
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xl font-semibold tabular-nums">
                        {nf.format(item.count)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <RankChart
              title="Top drugs by drug-gene interactions"
              description="Highest interaction counts across the drug catalogue"
              items={data?.topDrugs}
              loading={isPending}
              color="var(--chart-1)"
            />
            <RankChart
              title="Top genes by drug-gene interactions"
              description="Genes with the most annotated drug interactions"
              items={data?.topGenes}
              loading={isPending}
              color="var(--chart-2)"
            />
          </div>
        </section>

        {/* Recent recommendations */}
        <section>
          <SectionTitle>Recent recommendations</SectionTitle>
          <Card>
            <CardContent className="p-0">
              {isPending ? (
                <div className="space-y-3 p-6">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ) : data!.recentRecommendations.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  No recommendations recorded yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Drug</TableHead>
                        <TableHead>Gene</TableHead>
                        <TableHead>Variant</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="min-w-[280px]">Recommendation</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data!.recentRecommendations.map((row: RecommendationRow) => (
                        <TableRow key={`${row.patient}-${row.drug}-${row.variant}`}>
                          <TableCell className="font-medium">{row.patient}</TableCell>
                          <TableCell className="capitalize">{row.drug}</TableCell>
                          <TableCell className="font-mono text-xs">{row.gene}</TableCell>
                          <TableCell className="font-mono text-xs">{row.variant}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{row.type}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {row.recommendation}
                          </TableCell>
                          <TableCell>{row.source}</TableCell>
                          <TableCell>
                            <Badge variant={row.status === "Active" ? "default" : "secondary"}>
                              {row.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Guidelines */}
        <section>
          <SectionTitle>Guideline annotations</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-2">
            {isPending
              ? [0, 1].map((i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)
              : data!.guidelines.map((g) => (
                  <Card key={g.title}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="size-4 text-primary" />
                        <Badge variant="secondary">{g.consortium}</Badge>
                        <span className="text-xs capitalize text-muted-foreground">{g.drug}</span>
                      </div>
                      <CardTitle className="pt-2 text-sm font-medium leading-snug">
                        {g.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {g.genes.map((gene) => (
                        <Badge key={gene} variant="outline" className="font-mono text-[11px]">
                          {gene}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}

function RankChart({
  title,
  description,
  items,
  loading,
  color,
}: {
  title: string;
  description: string;
  items: CountItem[] | undefined;
  loading: boolean;
  color: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading || !items ? (
          <Skeleton className="h-80 w-full" />
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={items} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                  {items.map((item) => (
                    <Cell key={item.name} fill={color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
