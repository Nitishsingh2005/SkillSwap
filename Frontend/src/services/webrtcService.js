import SimplePeer from "simple-peer";

/**
 * WebRTCService — wraps simple-peer for SkillSwap video calls.
 * Manages local/remote streams, peer connections, screen sharing.
 */
class WebRTCService {
  constructor() {
    this.peer = null;
    this.localStream = null;
    this.screenStream = null;
    this.originalVideoTrack = null;
    this.isScreenSharing = false;

    // Signal buffer — holds signals that arrive before peer is created
    this._signalQueue = [];

    // callbacks
    this.onRemoteStream = null;
    this.onClose = null;
    this.onError = null;
    this.onSignal = null;
  }

  /**
   * Request camera + mic from user.
   * @param {boolean} videoEnabled
   * @param {boolean} audioEnabled
   * @returns {Promise<MediaStream>}
   */
  async initLocalStream(videoEnabled = true, audioEnabled = true) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          : false,
        audio: audioEnabled
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
      });
      return this.localStream;
    } catch (error) {
      console.error("Failed to get local media:", error);
      // Fallback: try audio-only if video fails
      if (videoEnabled) {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: audioEnabled,
          });
          return this.localStream;
        } catch (fallbackError) {
          throw fallbackError;
        }
      }
      throw error;
    }
  }

  /**
   * Create a simple-peer instance.
   * @param {boolean} isInitiator - true for the host
   * @param {Array} iceServers - list of STUN/TURN servers
   */
  createPeer(isInitiator, iceServers = []) {
    if (this.peer) {
      this.peer.destroy();
    }

    const config = {
      initiator: isInitiator,
      trickle: true,
      stream: this.localStream || undefined,
      config: {
        iceServers:
          iceServers.length > 0
            ? iceServers
            : [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
              ],
      },
    };

    this.peer = new SimplePeer(config);

    this.peer.on("signal", (data) => {
      console.log("📹 Peer generated signal:", data.type || "candidate");
      if (this.onSignal) this.onSignal(data);
    });

    this.peer.on("stream", (remoteStream) => {
      console.log("📹 Remote stream received, tracks:", remoteStream.getTracks().map(t => `${t.kind}:${t.enabled}`));
      if (this.onRemoteStream) this.onRemoteStream(remoteStream);
    });

    this.peer.on("connect", () => {
      console.log("📹 Peer data channel connected!");
    });

    this.peer.on("close", () => {
      console.log("📹 Peer connection closed");
      if (this.onClose) this.onClose();
    });

    this.peer.on("error", (err) => {
      console.error("📹 Peer error:", err);
      if (this.onError) this.onError(err);
    });

    // Flush any signals that arrived before the peer was created
    this._flushSignalQueue();

    return this.peer;
  }

  /**
   * Pass remote signaling data to the peer.
   * If the peer hasn't been created yet, buffer the signal.
   */
  signal(data) {
    if (this.peer && !this.peer.destroyed) {
      console.log("📹 Passing signal to peer:", data.type || "candidate");
      this.peer.signal(data);
    } else {
      console.log("📹 Buffering signal (peer not ready):", data.type || "candidate");
      this._signalQueue.push(data);
    }
  }

  /**
   * Flush any buffered signals to the peer.
   */
  _flushSignalQueue() {
    if (!this.peer || this.peer.destroyed) return;
    while (this._signalQueue.length > 0) {
      const data = this._signalQueue.shift();
      console.log("📹 Flushing buffered signal:", data.type || "candidate");
      this.peer.signal(data);
    }
  }

  /**
   * Toggle audio on/off.
   * @returns {boolean} new audio state
   */
  toggleAudio() {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  /**
   * Toggle video on/off.
   * @returns {boolean} new video state
   */
  toggleVideo() {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  /**
   * Start screen sharing — replaces video track in the peer connection.
   * @returns {Promise<MediaStream>} screen stream
   */
  async startScreenShare() {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      const screenTrack = this.screenStream.getVideoTracks()[0];

      // Save original camera track
      if (this.localStream) {
        this.originalVideoTrack = this.localStream.getVideoTracks()[0];
      }

      // Replace video track in peer connection
      if (this.peer && !this.peer.destroyed && this.originalVideoTrack) {
        this.peer.replaceTrack(
          this.originalVideoTrack,
          screenTrack,
          this.localStream
        );
      }

      this.isScreenSharing = true;

      // When user stops sharing via browser UI
      screenTrack.onended = () => {
        this.stopScreenShare();
      };

      return this.screenStream;
    } catch (error) {
      console.error("Screen share failed:", error);
      throw error;
    }
  }

  /**
   * Stop screen sharing — revert to camera track.
   */
  stopScreenShare() {
    if (!this.isScreenSharing) return;

    const screenTrack = this.screenStream?.getVideoTracks()[0];

    // Restore original camera track
    if (
      this.peer &&
      !this.peer.destroyed &&
      screenTrack &&
      this.originalVideoTrack
    ) {
      this.peer.replaceTrack(
        screenTrack,
        this.originalVideoTrack,
        this.localStream
      );
    }

    // Stop screen stream tracks
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    this.isScreenSharing = false;
    this.originalVideoTrack = null;
  }

  /**
   * Get connection stats (bitrate, packet loss).
   * @returns {Promise<Object>}
   */
  async getStats() {
    if (!this.peer || !this.peer._pc) return null;
    try {
      const stats = await this.peer._pc.getStats();
      let result = { bytesReceived: 0, bytesSent: 0, packetsLost: 0 };
      stats.forEach((report) => {
        if (report.type === "inbound-rtp" && report.kind === "video") {
          result.bytesReceived = report.bytesReceived || 0;
          result.packetsLost = report.packetsLost || 0;
        }
        if (report.type === "outbound-rtp" && report.kind === "video") {
          result.bytesSent = report.bytesSent || 0;
        }
      });
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Destroy everything — stop tracks, destroy peer.
   */
  destroy() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.isScreenSharing = false;
    this.originalVideoTrack = null;
    this.onRemoteStream = null;
    this.onClose = null;
    this.onError = null;
    this.onSignal = null;
  }
}

export default WebRTCService;
