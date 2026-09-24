import React, { useState } from 'react';
import { 
  X, 
  Activity, 
  Wifi, 
  WifiOff, 
  Mic, 
  MicOff, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Copy, 
  Check, 
  Terminal, 
  Users, 
  Radio,
  Volume2
} from 'lucide-react';
import { SignalingConnectionStatus, RemoteParticipantPresence } from '../../services/websocketSignaling';
import { PeerDebugInfo, DebugEvent } from '../../hooks/useLiveVoiceChat';

interface WebRTCDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  signalingStatus: SignalingConnectionStatus;
  micPermissionState: string;
  micErrorMessage: string | null;
  serverParticipants: RemoteParticipantPresence[];
  peerDebugMap: Map<string, PeerDebugInfo>;
  debugEvents: DebugEvent[];
  speakingUserIds: Set<string>;
  onRetryMic: () => Promise<any>;
  onUnlockAudio: () => Promise<boolean>;
}

export const WebRTCDebugModal: React.FC<WebRTCDebugModalProps> = ({
  isOpen,
  onClose,
  roomId,
  signalingStatus,
  micPermissionState,
  micErrorMessage,
  serverParticipants,
  peerDebugMap,
  debugEvents,
  speakingUserIds,
  onRetryMic,
  onUnlockAudio,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'peers' | 'events'>('overview');
  const [retryingMic, setRetryingMic] = useState(false);

  if (!isOpen) return null;

  const handleCopyDiagnostics = () => {
    const data = {
      roomId,
      signalingStatus,
      micPermissionState,
      micErrorMessage,
      participantsCount: serverParticipants.length,
      peers: Array.from(peerDebugMap.values()),
      recentEvents: debugEvents.slice(0, 15),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMicRetryClick = async () => {
    setRetryingMic(true);
    try {
      await onRetryMic();
    } catch (e) {}
    setRetryingMic(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Activity size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                WebRTC & Signaling Inspector
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Room: {roomId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDiagnostics}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-300 flex items-center gap-1 border border-slate-700"
              title="Copy diagnostic report"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Report'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 text-center font-bold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('peers')}
            className={`flex-1 py-2 text-center font-bold border-b-2 transition-colors ${
              activeTab === 'peers'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Peers ({peerDebugMap.size})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-2 text-center font-bold border-b-2 transition-colors ${
              activeTab === 'events'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Logs ({debugEvents.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-3">
              
              {/* Status Cards Grid */}
              <div className="grid grid-cols-2 gap-2">
                
                {/* Signaling State */}
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Signaling WebSocket
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {signalingStatus === 'connected' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="font-bold text-emerald-400">Connected</span>
                      </>
                    ) : signalingStatus === 'reconnecting' ? (
                      <>
                        <RefreshCw size={12} className="text-amber-400 animate-spin" />
                        <span className="font-bold text-amber-400">Reconnecting...</span>
                      </>
                    ) : (
                      <>
                        <WifiOff size={12} className="text-rose-400" />
                        <span className="font-bold text-rose-400 capitalize">{signalingStatus}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Microphone State */}
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Microphone Status
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {micPermissionState === 'granted' ? (
                      <>
                        <Mic size={13} className="text-emerald-400" />
                        <span className="font-bold text-emerald-400">Granted</span>
                      </>
                    ) : micPermissionState === 'requesting' ? (
                      <>
                        <RefreshCw size={12} className="text-cyan-400 animate-spin" />
                        <span className="font-bold text-cyan-400">Requesting...</span>
                      </>
                    ) : micPermissionState === 'denied' ? (
                      <>
                        <MicOff size={13} className="text-rose-400" />
                        <span className="font-bold text-rose-400">Denied</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={13} className="text-amber-400" />
                        <span className="font-bold text-amber-400 capitalize">{micPermissionState}</span>
                      </>
                    )}
                  </div>
                </div>

              </div>

              {/* Microphone Error Warning if any */}
              {micErrorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex items-start gap-2">
                  <AlertTriangle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-[11px] text-rose-300">Microphone Issue</p>
                    <p className="text-[10px] text-rose-200/80 mt-0.5">{micErrorMessage}</p>
                    <button
                      onClick={handleMicRetryClick}
                      disabled={retryingMic}
                      className="mt-1.5 px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] flex items-center gap-1"
                    >
                      <RefreshCw size={10} className={retryingMic ? 'animate-spin' : ''} />
                      <span>Retry Microphone Access</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Audio Autoplay Helper */}
              <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <p className="font-bold text-cyan-300">Audio Playback & Context</p>
                  <p className="text-[10px] text-slate-400">Ensure browser audio pipeline is unmuted</p>
                </div>
                <button
                  onClick={() => onUnlockAudio()}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-bold flex items-center gap-1"
                >
                  <Volume2 size={12} />
                  <span>Unlock Audio</span>
                </button>
              </div>

              {/* Active Room Participants List */}
              <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-2.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Users size={12} className="text-cyan-400" />
                    Room Presence ({serverParticipants.length} remote)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Instant mesh sync</span>
                </div>

                {serverParticipants.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic py-2 text-center">
                    No other participants in room yet. Open in a second tab to test multi-user audio!
                  </p>
                ) : (
                  <div className="divide-y divide-slate-800/80">
                    {serverParticipants.map(p => {
                      const peerInfo = peerDebugMap.get(p.userId);
                      const isSpeaking = speakingUserIds.has(p.userId);

                      return (
                        <div key={p.userId} className="py-1.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative">
                              <img
                                src={p.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                alt={p.userName}
                                className="w-6 h-6 rounded-full object-cover border border-slate-700"
                              />
                              {isSpeaking && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate max-w-[120px]">{p.userName}</p>
                              <p className="text-[9px] text-slate-500 font-mono truncate max-w-[120px]">{p.userId}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                            {/* Speaking Badge */}
                            {isSpeaking ? (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                                Speaking
                              </span>
                            ) : p.isMuted ? (
                              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                Muted
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                Listening
                              </span>
                            )}

                            {/* WebRTC State Badge */}
                            <span className={`px-1.5 py-0.2 rounded font-bold border ${
                              peerInfo?.connectionState === 'connected'
                                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                                : peerInfo?.connectionState === 'connecting'
                                ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {peerInfo?.connectionState || 'init'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'peers' && (
            <div className="space-y-2">
              {peerDebugMap.size === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <Radio size={24} className="mx-auto text-slate-600 mb-1" />
                  <p>No active WebRTC peer connections established yet.</p>
                  <p className="text-[10px] text-slate-600 mt-1">Connections initialize automatically when participants take mic seats.</p>
                </div>
              ) : (
                Array.from(peerDebugMap.values()).map((peer: PeerDebugInfo) => (
                  <div key={peer.peerId} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-300 font-bold">{peer.peerId}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        peer.connectionState === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {peer.connectionState}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                      <div>ICE: <span className="text-white">{peer.iceConnectionState}</span></div>
                      <div>Signaling: <span className="text-white">{peer.signalingState}</span></div>
                      <div>Remote Track: <span className={peer.hasRemoteTrack ? 'text-emerald-400' : 'text-slate-500'}>{peer.hasRemoteTrack ? 'Yes' : 'No'}</span></div>
                      <div>Audio Level: <span className="text-white">{peer.audioLevel}%</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-1 font-mono text-[10px]">
              {debugEvents.length === 0 ? (
                <p className="text-center py-4 text-slate-500">No events logged yet.</p>
              ) : (
                debugEvents.map(evt => (
                  <div key={evt.id} className="p-1.5 rounded bg-slate-950/60 border border-slate-800/80 flex items-start gap-1.5">
                    <span className="text-slate-500 shrink-0">{evt.timestamp}</span>
                    <span className={`px-1 rounded text-[9px] shrink-0 uppercase font-bold ${
                      evt.type === 'error'
                        ? 'bg-rose-500/20 text-rose-400'
                        : evt.type === 'join'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : evt.type === 'leave'
                        ? 'bg-amber-500/20 text-amber-400'
                        : evt.type === 'connection'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {evt.type}
                    </span>
                    <span className="text-slate-300 break-words flex-1">{evt.message}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-mono">STUN/TURN: Enabled (OpenRelay & Google)</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
