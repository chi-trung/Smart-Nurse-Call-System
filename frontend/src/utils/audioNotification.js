// Sound notification utility using Web Audio API
export const playAlertSound = (type = 'emergency') => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    if (type === 'emergency') {
      // Tạo âm thanh cảnh báo: beep liên tục
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequency cao
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      oscillator.start(now);
      oscillator.stop(now + 0.5);
      
      // Phát 3 lần beep
      for (let i = 1; i < 3; i++) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, now + i * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.7 + 0.5);
        
        osc.start(now + i * 0.7);
        osc.stop(now + i * 0.7 + 0.5);
      }
    } else {
      // Âm thanh hoàn thành: single beep
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 600;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      oscillator.start(now);
      oscillator.stop(now + 0.3);
    }
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

// Vibrate notification (nếu device support)
export const triggerVibration = (type = 'emergency') => {
  if ('vibrate' in navigator) {
    if (type === 'emergency') {
      navigator.vibrate([200, 100, 200, 100, 200]); // Pattern 3 lần
    } else {
      navigator.vibrate(200);
    }
  }
};
