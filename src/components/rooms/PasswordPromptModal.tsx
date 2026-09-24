import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, X, KeyRound, AlertCircle } from 'lucide-react';

export const PasswordPromptModal: React.FC = () => {
  const { 
    isPasswordModalOpen, 
    setIsPasswordModalOpen, 
    roomPendingPassword, 
    setRoomPendingPassword,
    joinRoom 
  } = useApp();

  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isPasswordModalOpen || !roomPendingPassword) return null;

  const handleClose = () => {
    setIsPasswordModalOpen(false);
    setRoomPendingPassword(null);
    setPasswordInput('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setError('Please enter the room passcode');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await joinRoom(roomPendingPassword, passwordInput.trim());
    setLoading(false);

    if (result.success) {
      handleClose();
    } else {
      setError(result.error || 'Incorrect passcode. Access denied.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-sm p-6 relative shadow-2xl animate-in zoom-in-95 text-slate-100">
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
          title="Close"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Lock size={28} />
          </div>
          <h3 className="text-lg font-bold text-white">Private Room Access</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
            <span className="font-semibold text-slate-200">"{roomPendingPassword.title}"</span> requires a security passcode to enter.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound size={14} className="text-amber-400" />
              Room Passcode
            </label>
            <input 
              type="password"
              autoFocus
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter 4-8 digit passcode"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest placeholder:text-slate-600 focus:outline-none focus:border-amber-400 font-mono transition-colors"
              maxLength={12}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !passwordInput.trim()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all shadow-md shadow-amber-500/20"
            >
              {loading ? 'Verifying...' : 'Unlock & Join'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
