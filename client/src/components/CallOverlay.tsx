import React, { useEffect, useRef } from 'react';
import { useCall } from '../context/CallContext';

const CallOverlay: React.FC = () => {
  const {
    isCalling,
    incomingCall,
    callActive,
    localStream,
    remoteStream,
    callType,
    remoteUser,
    answerCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    isAudioMuted,
    isVideoOff,
    callDuration,
    formatDuration
  } = useCall();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const outgoingAudioRef = useRef<HTMLAudioElement>(null);
  const incomingAudioRef = useRef<HTMLAudioElement>(null);

  // Sound URLs (Using high-quality, recognizable tones)
  const OUTGOING_RING_URL = "https://assets.mixkit.co/active_storage/sfx/1358/1358-preview.mp3"; // Standard phone ring
  const INCOMING_RING_URL = "https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3"; // Incoming call tone

  // Handle ringing sound effects
  useEffect(() => {
    const currentOutgoingAudio = outgoingAudioRef.current;
    const currentIncomingAudio = incomingAudioRef.current;

    // Handle Outgoing Ringing
    if (isCalling && !callActive) {
      const playOutgoing = () => {
        if (currentOutgoingAudio) {
          currentOutgoingAudio.loop = true;
          currentOutgoingAudio.play().catch(e => {
            if (e.name !== 'NotAllowedError') console.error("WebRTC Audio: Outgoing playback error:", e);
          });
        }
      };
      // Small delay to ensure ref corresponds to the DOM
      const timeoutId = setTimeout(playOutgoing, 100);
      return () => clearTimeout(timeoutId);
    } else if (currentOutgoingAudio) {
      currentOutgoingAudio.pause();
      currentOutgoingAudio.currentTime = 0;
    }

    // Handle Incoming Ringing
    if (incomingCall && !callActive) {
      const playIncoming = () => {
        if (currentIncomingAudio) {
          currentIncomingAudio.loop = true;
          currentIncomingAudio.play().catch(e => {
            if (e.name !== 'NotAllowedError') console.error("WebRTC Audio: Incoming playback error:", e);
          });
        }
      };
      // Small delay to ensure ref corresponds to the DOM
      const timeoutId = setTimeout(playIncoming, 100);
      return () => clearTimeout(timeoutId);
    } else if (currentIncomingAudio) {
      currentIncomingAudio.pause();
      currentIncomingAudio.currentTime = 0;
    }

    return () => {
      // Cleanup on unmount using local variables to prevent ref change issues
      if (currentOutgoingAudio) currentOutgoingAudio.pause();
      if (currentIncomingAudio) currentIncomingAudio.pause();
    };
  }, [isCalling, incomingCall, callActive]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log('CallOverlay: Attaching local stream to video element', localStream.id);
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(e => console.warn("Local video play failed:", e));
    }
  }, [localStream, callActive]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log('CallOverlay: Attaching remote stream to video element', remoteStream.id);
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(e => {
        if (e.name !== 'AbortError') console.error("Remote video play failed:", e);
      });
    }
  }, [remoteStream, callActive]);

  const displayUser = incomingCall ? {
    name: incomingCall.fromName,
    pic: incomingCall.fromPic
  } : {
    name: remoteUser?.displayName || remoteUser?.username || 'User',
    pic: remoteUser?.profilePic
  };

  // Persistent background audio elements
  const persistentAudio = (
    <>
      <audio ref={outgoingAudioRef} src={OUTGOING_RING_URL} preload="auto" />
      <audio ref={incomingAudioRef} src={INCOMING_RING_URL} preload="auto" />
    </>
  );

  if (!isCalling && !incomingCall && !callActive) return persistentAudio;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-fade-in">
      {persistentAudio}

      {/* Incoming Call UI */}
      {incomingCall && !callActive && (
        <div className="glass-panel p-8 max-w-sm w-full text-center space-y-6 animate-slide-up shadow-2xl">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-primary-500 animate-ping opacity-20"></div>
            <div className="relative rounded-full bg-slate-200 dark:bg-dark-700 w-24 h-24 flex items-center justify-center text-3xl font-bold text-primary-600 shadow-xl overflow-hidden ring-4 ring-primary-500/30">
              {displayUser.pic ? (
                <img src={displayUser.pic} alt={displayUser.name} className="w-full h-full object-cover" />
              ) : (
                displayUser.name.charAt(0).toUpperCase()
              )}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{displayUser.name}</h3>
            <p className="text-primary-400 text-sm font-medium animate-pulse">Incoming {incomingCall.type} call...</p>
          </div>
          <div className="flex items-center justify-center space-x-6">
            <button
              onClick={rejectCall}
              className="p-5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all transform hover:scale-110 active:scale-95 shadow-lg shadow-red-500/20"
              title="Decline"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 8l-8 8m0-8l8 8" /></svg>
            </button>
            <button
              onClick={answerCall}
              className="p-5 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all transform hover:scale-110 active:scale-95 shadow-lg shadow-green-500/20"
              title="Accept"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Calling / Active Call UI */}
      {(isCalling || callActive) && (
        <div className="relative w-full h-full bg-slate-900 overflow-hidden flex flex-col">
          {/* Main Remote Video Container */}
          <div className="flex-1 relative bg-black flex items-center justify-center">
            {/* 
              CRITICAL: The video element MUST always be rendered if a remoteStream exists, 
              even for AUDIO calls, otherwise the audio will NEVER play.
              We hide it visually for audio calls but keep it in the DOM.
            */}
            {remoteStream && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-contain ${callType === 'video' ? 'block' : 'hidden'}`}
              />
            )}

            {(callType === 'audio' || !remoteStream || (remoteStream.getVideoTracks().length === 0 && remoteStream.getAudioTracks().length === 0)) && (
              <div className="flex flex-col items-center">
                <div className="w-40 h-40 rounded-full bg-slate-800 flex items-center justify-center text-5xl font-bold text-white shadow-2xl border-4 border-primary-500/20 overflow-hidden">
                  {displayUser.pic ? (
                    <img src={displayUser.pic} alt={displayUser.name} className="w-full h-full object-cover" />
                  ) : (
                    displayUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <p className="mt-8 text-white text-2xl font-bold">{displayUser.name}</p>
                <div className="mt-4 flex flex-col items-center">
                  <p className="text-primary-400 font-medium tracking-widest text-sm uppercase">
                    {isCalling ? 'Ringing...' : 'Connected'}
                  </p>
                  {callActive && (
                    <p className="mt-2 text-white/90 font-mono text-xl tabular-nums tracking-wider animate-pulse">
                      {formatDuration(callDuration)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Local Preview (Picture-in-Picture) */}
            <div className="absolute top-8 right-8 w-48 h-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 glass-panel bg-slate-800/40 animate-slide-left z-10">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover mirror ${isVideoOff ? 'hidden' : 'block'}`}
              />
              {isVideoOff && (
                <div className="w-full h-full flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
                  <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>
              )}
            </div>
          </div>

          {/* Control Bar */}
          <div className="p-10 flex items-center justify-center bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0 z-20">
            <div className="flex items-center space-x-6 px-8 py-4 rounded-3xl glass-panel shadow-2xl backdrop-blur-2xl border-white/5 animate-slide-up">
              <button
                onClick={toggleAudio}
                className={`p-4 rounded-full transition-all duration-300 ${isAudioMuted ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-200/50 hover:bg-slate-200 text-white'}`}
                aria-label={isAudioMuted ? "Unmute" : "Mute"}
              >
                {isAudioMuted ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                )}
              </button>

              {callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-all duration-300 ${isVideoOff ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-200/50 hover:bg-slate-200 text-white'}`}
                  aria-label={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                >
                  {isVideoOff ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zm10-10l6 6m0-6l-6 6" /></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  )}
                </button>
              )}

              <button
                onClick={endCall}
                className="p-5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all transform hover:scale-110 active:scale-95 shadow-xl shadow-red-600/30 ring-4 ring-red-600/20"
                title="Hang up"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 8l-8 8m0-8l8 8" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallOverlay;
