'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scale, Package, Calculator, Check } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatPKR, formatGrams } from '@/lib/format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface WeightCalculatorModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (grams: number, subtotal: number) => void;
}

export function WeightCalculatorModal({
  product,
  open,
  onClose,
  onConfirm,
}: WeightCalculatorModalProps) {
  const [activeTab, setActiveTab] = useState('grams');
  const [grams, setGrams] = useState('');
  const [kg, setKg] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  useEffect(() => {
    if (open) {
      setGrams('');
      setKg('');
      setTargetAmount('');
      setActiveTab('grams');
    }
  }, [open]);

  if (!product) return null;

  const pricePerKg = product.base_selling_price;

  // Calculate from grams input
  const gramsValue = parseFloat(grams) || 0;
  const subtotalFromGrams = (gramsValue / 1000) * pricePerKg;

  // Calculate from kg input
  const kgValue = parseFloat(kg) || 0;
  const gramsFromKg = kgValue * 1000;
  const subtotalFromKg = kgValue * pricePerKg;

  // Calculate from target amount ("Paise ki Chini")
  const targetValue = parseFloat(targetAmount) || 0;
  const gramsFromAmount = pricePerKg > 0 ? (targetValue / pricePerKg) * 1000 : 0;
  const subtotalFromAmount = targetValue;

  // Quick Pao buttons
  const paoOptions = [
    { label: '1 Pao', grams: 250 },
    { label: '2 Pao', grams: 500 },
    { label: '3 Pao', grams: 750 },
    { label: '4 Pao (1 kg)', grams: 1000 },
  ];

  // Current active calculation
  let currentGrams = 0;
  let currentSubtotal = 0;
  if (activeTab === 'grams') {
    currentGrams = gramsValue;
    currentSubtotal = subtotalFromGrams;
  } else if (activeTab === 'kilograms') {
    currentGrams = gramsFromKg;
    currentSubtotal = subtotalFromKg;
  } else if (activeTab === 'amount') {
    currentGrams = gramsFromAmount;
    currentSubtotal = subtotalFromAmount;
  }

  function handlePaoClick(paoGrams: number) {
    setGrams(String(paoGrams));
    setActiveTab('grams');
  }

  function handleConfirm() {
    if (currentGrams <= 0) return;
    onConfirm(currentGrams, currentSubtotal);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Weight Calculator
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{product.name}</span>
            {' — '}
            Rs. {formatPKR(pricePerKg)}/kg
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="grams" className="text-xs">
              <Package className="w-3.5 h-3.5 mr-1" />
              Grams
            </TabsTrigger>
            <TabsTrigger value="kilograms" className="text-xs">
              <Scale className="w-3.5 h-3.5 mr-1" />
              Kilograms
            </TabsTrigger>
            <TabsTrigger value="amount" className="text-xs">
              <Calculator className="w-3.5 h-3.5 mr-1" />
              PKR Amount
            </TabsTrigger>
          </TabsList>

          {/* Grams Tab */}
          <TabsContent value="grams" className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="grams-input">Weight in Grams</Label>
              <Input
                id="grams-input"
                type="number"
                placeholder="e.g. 250, 500, 750"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                autoFocus
                className="text-lg font-medium"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {paoOptions.map((pao) => (
                <Button
                  key={pao.grams}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePaoClick(pao.grams)}
                  className="justify-start"
                >
                  <span className="font-medium">{pao.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{pao.grams}g</span>
                </Button>
              ))}
            </div>
          </TabsContent>

          {/* Kilograms Tab */}
          <TabsContent value="kilograms" className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="kg-input">Weight in Kilograms</Label>
              <Input
                id="kg-input"
                type="number"
                step="0.001"
                placeholder="e.g. 0.5, 1.5, 2.5"
                value={kg}
                onChange={(e) => setKg(e.target.value)}
                autoFocus
                className="text-lg font-medium"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0.25, 0.5, 1, 2].map((q) => (
                <Button
                  key={q}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setKg(String(q));
                    setActiveTab('kilograms');
                  }}
                >
                  {q} kg
                </Button>
              ))}
            </div>
          </TabsContent>

          {/* Amount Tab — "Paise ki Chini" */}
          <TabsContent value="amount" className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="amount-input">Target Amount (PKR) - "Paise ki Chini"</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                  Rs.
                </span>
                <Input
                  id="amount-input"
                  type="number"
                  placeholder="e.g. 100, 200, 500"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  autoFocus
                  className="text-lg font-medium pl-12"
                />
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
              <p className="text-xs text-muted-foreground">Calculated weight for your amount:</p>
              <p className="text-2xl font-bold text-primary tabular-nums">
                {formatGrams(gramsFromAmount)}
              </p>
              <p className="text-xs text-muted-foreground">
                Formula: (Rs. {formatPKR(targetValue)} / Rs. {formatPKR(pricePerKg)} per kg) × 1000
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Live Calculation Summary */}
        <motion.div
          key={`${currentGrams}-${currentSubtotal}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between"
        >
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Calculated Weight</p>
            <p className="text-xl font-bold tabular-nums">{formatGrams(currentGrams)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-0.5">Subtotal</p>
            <p className="text-xl font-bold text-primary tabular-nums">
              Rs. {formatPKR(currentSubtotal)}
            </p>
          </div>
        </motion.div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={currentGrams <= 0}>
            <Check className="w-4 h-4 mr-1" />
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
