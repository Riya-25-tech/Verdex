"use client";

import { useState } from "react";
import { cmBorrow, cmDepositCollateral, cmRepay, cmWithdrawCollateral } from "@/lib/contracts";
import { useAppData } from "@/lib/data";
import { LIQUIDATION_THRESHOLD_BPS, MIN_COLLATERAL_RATIO_BPS, SCALE } from "@/lib/config";
import { bpsToPct, formatAmount, formatUSD, fromStroops, toStroops } from "@/lib/format";
import { addInterestPaid, logActivity } from "@/lib/history";
import { useTx } from "@/lib/useTx";
import { AmountInput, Button, Field, Pill } from "@/components/ui";
import { Tabs, TxFeedback } from "@/components/TxFeedback";

const TABS = ["borrow", "repay", "collateral", "withdraw"] as const;
type Tab = (typeof TABS)[number];
const LABELS: Record<Tab, string> = {
  borrow: "Borrow USDC",
  repay: "Repay USDC",
  collateral: "Add XLM collateral",
  withdraw: "Withdraw XLM collateral",
};

function ratioBps(collateral: bigint, price: bigint, debt: bigint): bigint | null {
  if (debt <= 0n) return null;
  return ((collateral * price) / BigInt(SCALE)) * 10_000n / debt;
}
function tone(bps: bigint | null): "good" | "warn" | "bad" {
  if (bps === null) return "good";
  const v = Number(bps);
  if (v < LIQUIDATION_THRESHOLD_BPS) return "bad";
  if (v < MIN_COLLATERAL_RATIO_BPS) return "warn";
  return "good";
}

export function BorrowActions() {
  const [tab, setTab] = useState<Tab>("borrow");
  const [amount, setAmount] = useState("");
  const { borrower, balances, pool } = useAppData();
  const { run, status, error, hash, reset, address } = useTx();

  const price = borrower?.xlmPriceScaled ?? 0n;
  const pos = borrower?.position ?? { collateral: 0n, principal: 0n, interest: 0n, lastUpdate: 0n };
  const debt = pos.principal + pos.interest;
  const value = toStroops(amount);
  const num = Number(amount) || 0;

  // Projected state
  let projCollateral = pos.collateral;
  let projDebt = debt;
  if (tab === "collateral") projCollateral += value;
  if (tab === "withdraw") projCollateral -= value;
  if (tab === "borrow") projDebt += value;
  if (tab === "repay") projDebt = projDebt > value ? projDebt - value : 0n;
  const projRatio = ratioBps(projCollateral, price, projDebt);

  // Borrow tab: required collateral for total debt
  const requiredCollateral =
    price > 0n && projDebt > 0n
      ? (projDebt * BigInt(MIN_COLLATERAL_RATIO_BPS) * BigInt(SCALE) + 10_000n * price - 1n) / (10_000n * price)
      : 0n;
  const shortfall = requiredCollateral > pos.collateral ? requiredCollateral - pos.collateral : 0n;

  // Collateral tab: max borrowable with projected collateral
  const projCollateralValue = (projCollateral * price) / BigInt(SCALE);
  const maxBorrowTotal = (projCollateralValue * 10_000n) / BigInt(MIN_COLLATERAL_RATIO_BPS);
  const collateralHeadroom = maxBorrowTotal > debt ? maxBorrowTotal - debt : 0n;
  // Collateral is only half the constraint: the pool also has to hold enough
  // idle USDC to release. Offering the full collateral-based figure sent
  // borrowers into a revert whenever utilization was high.
  const liquidity = pool?.availableLiquidity ?? collateralHeadroom;
  const borrowable = collateralHeadroom < liquidity ? collateralHeadroom : liquidity;
  const liquidityCapped = tab === "borrow" && liquidity < collateralHeadroom;
  const overLiquidity = tab === "borrow" && pool != null && value > pool.availableLiquidity;

  const isXlm = tab === "collateral" || tab === "withdraw";
  const willBreak = (tab === "borrow" || tab === "withdraw") && projRatio !== null && Number(projRatio) < MIN_COLLATERAL_RATIO_BPS;
  const insufficientFunds =
    (tab === "collateral" && value > (balances?.xlm ?? 0n)) ||
    (tab === "repay" && value > (balances?.usdc ?? 0n)) ||
    (tab === "withdraw" && value > pos.collateral);

  function max() {
    if (tab === "collateral") setAmount(String(Math.max(0, fromStroops(balances?.xlm ?? 0n) - 5)));
    if (tab === "repay") {
      // Interest keeps accruing between this read and the moment the ledger
      // applies the transaction, so paying exactly `debt` always left a few
      // stroops of dust behind and the position never closed. `repay` clamps
      // to what is actually owed, so a small overshoot is safe.
      const target = debt + debt / 1000n + 1n;
      const usdcBal = balances?.usdc ?? 0n;
      setAmount(String(fromStroops(target < usdcBal ? target : usdcBal)));
    }
    if (tab === "withdraw") setAmount(String(fromStroops(pos.collateral)));
    if (tab === "borrow") setAmount(String(fromStroops(borrowable)));
    reset();
  }

  async function submit() {
    if (value <= 0n || !address) return;
    let ok = false;
    if (tab === "borrow") ok = await run((a, s) => cmBorrow(a, value, a, s), "Borrow");
    else if (tab === "repay") {
      const interestPortion = Math.min(num, fromStroops(pos.interest));
      ok = await run((a, s) => cmRepay(a, value, a, s), "Repay");
      if (ok) addInterestPaid(address, interestPortion);
    } else if (tab === "collateral") ok = await run((a, s) => cmDepositCollateral(a, value, a, s), "Add collateral");
    else ok = await run((a, s) => cmWithdrawCollateral(a, value, a, s), "Withdraw collateral");

    if (ok) {
      const map: Record<Tab, Parameters<typeof logActivity>[1]["type"]> = {
        borrow: "borrow",
        repay: "repay",
        collateral: "add-collateral",
        withdraw: "withdraw-collateral",
      };
      logActivity(address, { type: map[tab], amount: num, asset: isXlm ? "XLM" : "USDC", t: Date.now() });
      setAmount("");
    }
  }

  return (
    <div className="rounded-2xl border bg-[var(--card)] p-5 shadow-card">
      <Tabs tabs={TABS} active={tab} onChange={(t) => (setTab(t), setAmount(""), reset())} />

      <Field
        label={LABELS[tab]}
        hint={
          <button onClick={max} className="font-medium text-[var(--accent)] hover:opacity-80">
            {tab === "collateral" && `Balance ${formatAmount(balances?.xlm ?? 0n)} XLM · Max`}
            {tab === "borrow" && `Up to ${formatAmount(borrowable)} USDC · Max`}
            {tab === "repay" && `Owed ${formatAmount(debt)} USDC · Max`}
            {tab === "withdraw" && `Locked ${formatAmount(pos.collateral)} XLM · Max`}
          </button>
        }
      >
        <AmountInput value={amount} onChange={(v) => (setAmount(v), reset())} suffix={isXlm ? "XLM" : "USDC"} />
      </Field>

      {/* Borrow: required collateral */}
      {tab === "borrow" && value > 0n && price > 0n && (
        <div className="mt-3 rounded-xl border bg-[var(--bg)] p-3 text-sm">
          <Row label="Collateral required (150%)" value={`${formatAmount(requiredCollateral)} XLM`} strong />
          <Row label="You have locked" value={`${formatAmount(pos.collateral)} XLM`} />
          {shortfall > 0n && (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[var(--warn-soft)] px-2.5 py-2">
              <span className="text-xs text-[var(--warn)]">Add {formatAmount(shortfall)} XLM first.</span>
              <button
                onClick={() => { setTab("collateral"); setAmount(String(fromStroops(shortfall))); reset(); }}
                className="shrink-0 rounded-lg bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[var(--accent-strong)]"
              >
                Add collateral
              </button>
            </div>
          )}
        </div>
      )}

      {/* Collateral: max borrowable */}
      {tab === "collateral" && value > 0n && price > 0n && (
        <div className="mt-3 rounded-xl border bg-[var(--bg)] p-3 text-sm">
          <Row label="Collateral value" value={formatUSD(projCollateralValue)} />
          <Row label="Max borrowable (after)" value={formatUSD(borrowable)} strong accent />
        </div>
      )}

      {/* Health preview */}
      <div className="mt-3 flex items-center justify-between rounded-xl border bg-[var(--bg)] px-3 py-2.5">
        <span className="text-xs text-[var(--text-dim)]">Projected health</span>
        <Pill tone={tone(projRatio)}>
          {projRatio === null ? "No debt" : bpsToPct(projRatio)}
          <span className="text-[var(--text-dim)]">· min {MIN_COLLATERAL_RATIO_BPS / 100}%</span>
        </Pill>
      </div>

      {willBreak && (
        <p className="mt-2 text-xs text-[var(--warn)]">
          This would drop below the {MIN_COLLATERAL_RATIO_BPS / 100}% minimum and be rejected.
        </p>
      )}
      {overLiquidity && (
        <p className="mt-2 text-xs text-[var(--warn)]">
          The pool only has {formatUSD(pool!.availableLiquidity)} available to lend right now — this
          borrow would revert.
        </p>
      )}
      {liquidityCapped && !overLiquidity && value <= 0n && (
        <p className="mt-2 text-xs text-[var(--text-dim)]">
          Your collateral supports more, but the pool currently has{" "}
          {formatUSD(pool!.availableLiquidity)} available to lend.
        </p>
      )}
      {insufficientFunds && value > 0n && (
        <p className="mt-2 text-xs text-[var(--warn)]">
          {tab === "collateral" && `You only have ${formatAmount(balances?.xlm ?? 0n)} XLM.`}
          {tab === "repay" && `You only have ${formatAmount(balances?.usdc ?? 0n)} USDC.`}
          {tab === "withdraw" && `You only have ${formatAmount(pos.collateral)} XLM locked.`}
        </p>
      )}

      <Button onClick={submit} loading={status === "pending"} disabled={value <= 0n || willBreak || insufficientFunds || overLiquidity} className="mt-4 w-full">
        {LABELS[tab]}
      </Button>
      <TxFeedback status={status} error={error} hash={hash} />
    </div>
  );
}

function Row({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[var(--text-dim)]">{label}</span>
      <span className={`tnum ${strong ? "font-semibold" : ""} ${accent ? "text-[var(--accent)]" : ""}`}>{value}</span>
    </div>
  );
}
