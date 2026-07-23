import { create } from 'zustand';

export interface CustomerLoyalty {
  customerId: string;
  points: number;
  lifetimeSpent: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

interface LoyaltyState {
  customerPoints: Record<string, CustomerLoyalty>;
  earnPoints: (customerId: string, spentAmount: number) => void;
  redeemPoints: (customerId: string, pointsToRedeem: number) => number; // Returns discount amount
  getCustomerTier: (customerId: string) => CustomerLoyalty;
}

export const useLoyaltyStore = create<LoyaltyState>((set, get) => ({
  customerPoints: {
    'cust-1': { customerId: 'cust-1', points: 250, lifetimeSpent: 250, tier: 'SILVER' },
  },

  earnPoints: (customerId, spentAmount) => {
    const { customerPoints } = get();
    const current = customerPoints[customerId] || {
      customerId,
      points: 0,
      lifetimeSpent: 0,
      tier: 'BRONZE',
    };

    const earned = Math.floor(spentAmount);
    const newPoints = current.points + earned;
    const newSpent = current.lifetimeSpent + spentAmount;

    let tier: CustomerLoyalty['tier'] = 'BRONZE';
    if (newSpent >= 1000) tier = 'PLATINUM';
    else if (newSpent >= 500) tier = 'GOLD';
    else if (newSpent >= 200) tier = 'SILVER';

    set({
      customerPoints: {
        ...customerPoints,
        [customerId]: { customerId, points: newPoints, lifetimeSpent: newSpent, tier },
      },
    });
  },

  redeemPoints: (customerId, pointsToRedeem) => {
    const { customerPoints } = get();
    const current = customerPoints[customerId];
    if (!current || current.points < pointsToRedeem) return 0;

    const discountAmount = (pointsToRedeem / 100) * 10; // 100 points = $10 discount
    set({
      customerPoints: {
        ...customerPoints,
        [customerId]: { ...current, points: current.points - pointsToRedeem },
      },
    });

    return discountAmount;
  },

  getCustomerTier: (customerId) => {
    return (
      get().customerPoints[customerId] || {
        customerId,
        points: 0,
        lifetimeSpent: 0,
        tier: 'BRONZE',
      }
    );
  },
}));
