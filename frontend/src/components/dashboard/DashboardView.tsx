"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  HandCoins,
  Layers,
  Lock,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useAppData } from "@/lib/data";
import { useWallet } from "@/lib/wallet";
import { LIQUIDATION_THRESHOLD_BPS, MIN_COLLATERAL_RATIO_BPS, SCALE } from "@/lib/config";
import { formatAmount, formatUSD, fromStroops } from "@/lib/format";
import { getActivity, getCostBasis, getInterestPaid } from "@/lib/history";
import { StatCard } from "@/components/app/StatCard";
import { HealthBar } from "@/components/app/HealthBar";
import { DeveloperTools } from "@/components/app/DeveloperTools";
import { Button, Card } from "@/components/ui";
import { ChartCard, EmptyChart } from "@/components/charts/ChartCard";
import { AllocationDonut } from "@/components/charts/AllocationDonut";
import { ProjectionChart } from "@/components/charts/ProjectionChart";
import { ActivityTimeline } from "./ActivityTimeline";

const ACTIONS = [
  { icon: ArrowUpRight, label: "Supply", href: "/app/supply" },
  { icon: HandCoins, label: "Borrow", href: "/app/borrow" },
  { icon: Coins, label: "Repay", href: "/app/borrow" },
  { icon: ArrowDownLeft, label: "Withdraw", href: "/app/supply" },
];

export function DashboardView() {
  const { pool, lender, borrower, loading } = useAppData();
  const { address, connect, connecting } = useWallet();

  if (!address) {
    return (
      <div className="space-y-8">
        <Header />
        <Card className="mx-auto flex min-h-[300px] max-w-md flex-col items-center justify-center gap-4 text-center">
          <div>
            <p className="text-lg font-semibold">Connect your wallet</p>
            <p className="mt-1 text-sm text-[var(--text-dim)]">Your portfolio, positions, and activity live here.</p>
          </div>
          <Button onClick={connect} loading={connecting}>Connect Wallet</Button>
        </Card>
      </div>
    );
  }

  const supplied = lender ? fromStroops(lender.valueScaled) : 0;
  const price = borrower?.xlmPriceScaled ?? 0n;
  const pos = borrower?.position ?? { collateral: 0n, principal: 0n, interest: 0n, lastUpdate: 0n };
  const debt = fromStroops(pos.principal + pos.interest);
  const collateralValue = fromStroops((pos.collateral * price) / BigInt(SCALE));
  const ratio = pos.principal + pos.interest > 0n ? ((pos.collateral * price) / BigInt(SCALE)) * 10_000n / (pos.principal + pos.interest) : null;
  const hf = ratio !== null ? Number(ratio) / LIQUIDATION_THRESHOLD_BPS : null;

  const costBasis = getCostBasis(address);
  const interestEarned = costBasis > 0 ? Math.max(0, supplied - costBasis) : 0;
  const interestPaid = getInterestPaid(address);
  const portfolioValue = supplied + collateralValue - debt;
  const activity = getActivity(address);

  return (
    <div className="space-y-8">
      <Header
        right={
          <div className="grid grid-cols-4 gap-2">
            {ACTIONS.map((a) => (
              <Link key={a.label} href={a.href} className="flex flex-col items-center gap-1 rounded-xl border bg-white px-3 py-2.5 text-xs font-medium shadow-card transition-colors hover:bg-[var(--card-hover)]">
                <a.icon className="h-4 w-4 text-[var(--accent)]" />
                {a.label}
              </Link>
            ))}
          </div>
        }
      />

      {/* Portfolio stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Portfolio Value" value={formatUSD(portfolioValue)} tone="accent" loading={loading && !lender} index={0} />
        <StatCard icon={Layers} label="Total Supplied" value={formatUSD(supplied)} tone="success" index={1} />
        <StatCard icon={HandCoins} label="Total Borrowed" value={formatUSD(debt)} tone="warn" index={2} />
        <StatCard icon={Lock} label="Collateral Locked" value={`${formatAmount(pos.collateral)} XLM`} sub={formatUSD(collateralValue)} index={3} />
        <StatCard icon={PiggyBank} label="Pool Shares" value={formatAmount(lender?.shares ?? 0n)} index={4} />
        <StatCard icon={TrendingUp} label="Interest Earned" value={formatUSD(interestEarned, 4)} tone="success" index={5} />
        <StatCard icon={TrendingDown} label="Interest Paid" value={formatUSD(interestPaid, 4)} tone="danger" index={6} />
        <StatCard icon={Coins} label="Health Factor" value={hf === null ? "—" : hf.toFixed(2)} tone={hf === null ? "default" : hf < 1 ? "danger" : hf < MIN_COLLATERAL_RATIO_BPS / LIQUIDATION_THRESHOLD_BPS ? "warn" : "success"} index={7} />
      </div>

      {borrower && (pos.collateral > 0n || pos.principal > 0n) && (
        <Card>
          <HealthBar ratioBps={ratio} />
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Portfolio Allocation" subtitle="Your assets in Verdex">
          <div className="flex h-[200px] items-center">
            <AllocationDonut
              centerLabel="Assets"
              segments={[
                { name: "Supplied", value: +supplied.toFixed(2), color: "#2563eb" },
                { name: "Collateral", value: +collateralValue.toFixed(2), color: "#7c3aed" },
              ]}
            />
          </div>
        </ChartCard>
        <ChartCard title="Supply vs Borrow" subtitle="Your position size">
          <div className="flex h-[200px] items-center">
            <AllocationDonut
              centerLabel="Net"
              segments={[
                { name: "Supplied", value: +supplied.toFixed(2), color: "#16a34a" },
                { name: "Borrowed", value: +debt.toFixed(2), color: "#ea8a04" },
              ]}
            />
          </div>
        </ChartCard>
        <ChartCard title="Interest Earned" subtitle="Projected at current APY (12 months)">
          {supplied > 0 ? <ProjectionChart principal={supplied} rate={pool?.lenderApy ?? 0} color="success" label="Projected value" /> : <EmptyChart message="Supply USDC to project your earnings." />}
        </ChartCard>
        <ChartCard title="Debt Growth" subtitle="Projected at current APR (12 months)">
          {debt > 0 ? <ProjectionChart principal={debt} rate={pool?.borrowApr ?? 0} color="warn" label="Projected debt" /> : <EmptyChart message="No debt — nothing to project." />}
        </ChartCard>
      </div>

      {/* Activity + dev tools */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <ChartCard title="Activity" subtitle="Your recent actions">
          <ActivityTimeline items={activity} />
        </ChartCard>
        <DeveloperTools />
      </div>
    </div>
  );
}

function Header({ right }: { right?: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="mt-1.5 text-sm text-[var(--text-dim)]">Your personal portfolio across Verdex.</p>
      </div>
      {right}
    </div>
  );
}
