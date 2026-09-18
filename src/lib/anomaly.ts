import { Baseline, Signal, Stage } from '@/types/carenet';

export interface AnomalyEvaluationResult {
  concern_score: number;
  stage: Stage;
  lateness_summary: string[];
  false_alarm_adjusted: boolean;
  suppression_count: number;
}

/**
 * Converts a "HH:MM" string to minutes from midnight (0..1439)
 */
export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Evaluates an elder's daily concern score based on routine baselines & today's signals.
 */
export function evaluateElderAnomaly(
  baselines: Baseline[],
  todaysSignals: Signal[],
  currentTimeMinutes: number, // e.g. 9:45 AM = 585
  recentFalseAlarmsCount: number = 0,
  elderId?: string
): AnomalyEvaluationResult {
  let totalScore = 0;
  const latenessSummary: string[] = [];
  const currentDayStart = currentTimeMinutes >= 0
    ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
    : 0;
  const currentDaySignals = todaysSignals.filter(signal => {
    if (elderId && signal.elder_id !== elderId) return false;
    return new Date(signal.occurred_at).getTime() >= currentDayStart;
  });

  for (const baseline of baselines) {
    const endMinutes = timeStringToMinutes(baseline.expected_time_end);
    
    // Check if a signal of this baseline type occurred today
    const signalOccurred = currentDaySignals.some(s => s.signal_type === baseline.signal_type);

    if (!signalOccurred && currentTimeMinutes > endMinutes) {
      const latenessMinutes = currentTimeMinutes - endMinutes;
      // Formula: min(100, (lateness_minutes / 60) * 20 * baseline.confidence)
      const severity = Math.min(100, (latenessMinutes / 60) * 20 * (baseline.confidence || 0.5));
      totalScore += Math.round(severity);

      const hoursLate = (latenessMinutes / 60).toFixed(1);
      latenessSummary.push(
        `Missing ${baseline.signal_type.replace('_', ' ')}: expected by ${baseline.expected_time_end} (${hoursLate}h late, +${Math.round(severity)} score)`
      );
    }
  }

  const falseAlarmAdjusted = recentFalseAlarmsCount >= 2;
  // Apply +20% threshold increase if false alarm suppression is active
  const thresholdMultiplier = falseAlarmAdjusted ? 1.2 : 1.0;

  const softConcernThreshold = 20 * thresholdMultiplier;
  const verifyThreshold = 40 * thresholdMultiplier;
  const localEscalationThreshold = 60 * thresholdMultiplier;

  let stage: Stage = 'normal';
  if (totalScore >= localEscalationThreshold) {
    stage = 'local_escalation';
  } else if (totalScore >= verifyThreshold) {
    stage = 'verify';
  } else if (totalScore >= softConcernThreshold) {
    stage = 'soft_concern';
  }

  return {
    concern_score: totalScore,
    stage,
    lateness_summary: latenessSummary,
    false_alarm_adjusted: falseAlarmAdjusted,
    suppression_count: recentFalseAlarmsCount
  };
}
