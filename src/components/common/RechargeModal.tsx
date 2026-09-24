import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Coins, Sparkles, CheckCircle2, CreditCard, Tag } from 'lucide-react';
import { soundEffects } from '../../utils/audio';

const COIN_PACKAGES = [
  { coins: 100, bonus: 0, price: '$0.99', popular: false },
  { coins: 550, bonus: 50, price: '$4.99', popular: false },
  { coins: 1200, bonus: 200, price: '$9.99', popular: true },
  { coins: 3000, bonus: 600, price: '$24.99', popular: false },
  { coins: 6500, bonus: 1500, price: '$49.99', popular: false },
  { coins: 15000, bonus: 5000, price: '$99.99', popular: false }
];

export const RechargeModal: React.FC = () => {
  const { showRechargeModal, setShowRechargeModal, rechargeCoins, currentUser } = useApp();
  const [promoCode, setPromoCode] = useState('');
  const [promoMsg, setPromoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!showRechargeModal) return null;

  const handlePurchase = async (pack: typeof COIN_PACKAGES[0]) => {
    setLoading(true);
    const totalCoins = pack.coins + pack.bonus;
    await rechargeCoins(totalCoins, `Top-up purchase (${pack.price})`);
    setLoading(false);
    setShowRechargeModal(false);
  };

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    if (promoCode.trim().toUpperCase() === 'STARLIVE_VIP' || promoCode.trim().toUpperCase() === 'STARLIVE') {
      await rechargeCoins(10000, 'VIP Promo Code Reward');
      setPromoMsg('🎉 10,000 VIP Coins successfully credited!');
      setPromoCode('');
    } else {
      setPromoMsg('❌ Invalid promo code. Try: STARLIVE_VIP');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 relative shadow-2xl animate-in zoom-in-95">
        <button 
          onClick={() => setShowRechargeModal(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Coins size={22} className="text-amber-400" />
            <div>
              <h3 className="text-sm font-black text-white">Coin Top-Up Store</h3>
              <p className="text-[11px] text-slate-400">Current balance: {currentUser.coins.toLocaleString()} Coins</p>
            </div>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {COIN_PACKAGES.map((pkg, idx) => (
            <div
              key={idx}
              onClick={() => handlePurchase(pkg)}
              className={`cursor-pointer relative p-3 rounded-2xl border transition-all active:scale-95 flex flex-col justify-between ${
                pkg.popular 
                  ? 'bg-amber-500/10 border-amber-400/80 hover:bg-amber-500/20' 
                  : 'bg-slate-800/70 border-slate-700/60 hover:border-slate-500 hover:bg-slate-800'
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-2 right-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow">
                  MOST POPULAR
                </span>
              )}

              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xl">🪙</span>
                <div>
                  <span className="text-sm font-black text-amber-300 font-mono">
                    {pkg.coins.toLocaleString()}
                  </span>
                  {pkg.bonus > 0 && (
                    <span className="text-[10px] text-emerald-400 font-bold block">
                      +{pkg.bonus} Free
                    </span>
                  )}
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full py-1.5 bg-slate-700 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold rounded-xl text-xs transition-colors"
              >
                {pkg.price}
              </button>
            </div>
          ))}
        </div>

        {/* Promo Code Box */}
        <form onSubmit={handleApplyPromo} className="pt-3 border-t border-slate-800">
          <label className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
            <Tag size={12} className="text-amber-400" />
            Have a Promo / Creator Code? (Try: <span className="text-amber-300 font-mono font-bold">STARLIVE_VIP</span>)
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none uppercase font-mono"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold rounded-xl text-xs"
            >
              Redeem
            </button>
          </div>
          {promoMsg && (
            <p className="text-[11px] mt-1.5 font-medium text-emerald-400">{promoMsg}</p>
          )}
        </form>

      </div>
    </div>
  );
};
