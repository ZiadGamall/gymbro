class SmartWatchSimulator {
  /**
   * Simulates syncing data from a smartwatch.
   * Returns a promise that resolves after a short delay with random but realistic health metrics.
   */
  static async syncData() {
    // Artificial delay to simulate bluetooth/network sync
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Base values for realistic generation
    const baseTotalSleepMin = 360 + Math.floor(Math.random() * 180); // 6 to 9 hours (360-540 mins)
    
    // Deep sleep is usually 15-25% of total sleep
    const deepSleepPct = 0.15 + (Math.random() * 0.10);
    const deepSleepMin = Math.floor(baseTotalSleepMin * deepSleepPct);
    
    // REM sleep is usually 20-25% of total sleep
    const remSleepPct = 0.20 + (Math.random() * 0.05);
    const remSleepMin = Math.floor(baseTotalSleepMin * remSleepPct);
    
    const hrAvgBpm = 45 + Math.floor(Math.random() * 25); // 45 to 70 bpm
    const sleepScore = 60 + Math.floor(Math.random() * 40); // 60 to 100
    const stressScore = 15 + Math.floor(Math.random() * 60); // 15 to 75
    const steps = 3000 + Math.floor(Math.random() * 12000); // 3000 to 15000 steps
    const activeMinutes = 15 + Math.floor(Math.random() * 105); // 15 to 120 mins

    return {
      total_sleep_min: baseTotalSleepMin,
      deep_sleep_min: deepSleepMin,
      rem_sleep_min: remSleepMin,
      hr_avg_bpm: hrAvgBpm,
      sleep_score: sleepScore,
      avg_stress_score: stressScore,
      steps: steps,
      active_minutes: activeMinutes
    };
  }
}

export default SmartWatchSimulator;
