import { StatCard as UIStatCard, type StatCardProps } from "@/components/ui/StatCard";

export { type StatCardProps };

export function StatCard(props: StatCardProps) {
  return <UIStatCard {...props} />;
}
