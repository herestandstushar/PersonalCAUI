"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import {
  useCreateAsset,
  useCreatePortfolio,
  usePortfolios,
} from "@/hooks/useFinanceData";
import { useResetOnOpen } from "@/hooks/useResetOnOpen";
import { getErrorMessage, getFieldErrors } from "@/lib/apiError";

const ASSET_TYPES = [
  { value: "stock", label: "Stock / Equity" },
  { value: "crypto", label: "Cryptocurrency" },
  { value: "mutual_fund", label: "Mutual Fund" },
  { value: "fixed_deposit", label: "Fixed Deposit" },
  { value: "real_estate", label: "Real Estate" },
  { value: "other", label: "Other" },
];

export function InvestmentModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { data: portfolios = [] } = usePortfolios();
  const createPortfolio = useCreatePortfolio();
  const createAsset = useCreateAsset();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [assetType, setAssetType] = useState("stock");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  useResetOnOpen(open, () => {
    setName("");
    setSymbol("");
    setAssetType("stock");
    setQuantity("");
    setBuyPrice("");
    setCurrentPrice("");
    setErrors({});
    setFormError("");
  });

  const busy = createAsset.isPending || createPortfolio.isPending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError("");

    if (!name.trim()) {
      setErrors({ name: "Give the asset a name." });
      return;
    }
    if (!Number(quantity) || !Number(buyPrice)) {
      setErrors({
        quantity: !Number(quantity) ? "Enter a quantity." : "",
        average_buy_price: !Number(buyPrice) ? "Enter the buy price." : "",
      });
      return;
    }

    try {
      // Assets require a portfolio; create a default one on first use.
      let portfolioId = portfolios[0]?.id;
      if (!portfolioId) {
        const created = await createPortfolio.mutateAsync({
          name: "My Portfolio",
        });
        portfolioId = created.id;
      }

      await createAsset.mutateAsync({
        portfolio: portfolioId,
        name: name.trim(),
        symbol: symbol.trim(),
        asset_type: assetType,
        quantity: Number(quantity),
        average_buy_price: Number(buyPrice).toFixed(2),
        current_price: Number(currentPrice || buyPrice).toFixed(2),
      });

      toast("Asset added to your portfolio.");
      onClose();
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add asset"
      description="Track a holding in your investment portfolio."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="asset-form" loading={busy}>
            Add asset
          </Button>
        </>
      }
    >
      <form id="asset-form" onSubmit={submit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Asset name"
            name="name"
            required
            placeholder="e.g. Reliance Industries"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <Input
            label="Symbol"
            name="symbol"
            placeholder="e.g. RELIANCE"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            error={errors.symbol}
          />
        </div>

        <Select
          label="Asset type"
          name="asset_type"
          value={assetType}
          onChange={(e) => setAssetType(e.target.value)}
          options={ASSET_TYPES}
          error={errors.asset_type}
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Quantity"
            name="quantity"
            type="number"
            step="0.000001"
            min="0"
            required
            placeholder="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            error={errors.quantity}
          />
          <Input
            label="Avg buy price"
            name="average_buy_price"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            error={errors.average_buy_price}
          />
          <Input
            label="Current price"
            name="current_price"
            type="number"
            step="0.01"
            min="0"
            placeholder="Same as buy"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(e.target.value)}
            error={errors.current_price}
          />
        </div>
      </form>
    </Modal>
  );
}
