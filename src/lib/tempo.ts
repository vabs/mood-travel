export type Tempo = 'quick' | 'steady' | 'slow-burn';

const TEMPO_LABELS: Record<Tempo, string> = {
  quick: 'Quick',
  steady: 'Steady',
  'slow-burn': 'Slow-burn',
};

// Editorial time/attention commitment — never a claim about how fast a
// resource changes how someone feels (see DESIGN.md's "Shift tempo" section).
export function tempoLabel(tempo: Tempo): string {
  return TEMPO_LABELS[tempo];
}

export function summarizeCommitment(timeToStart: string, duration?: string): string {
  return duration ? `${timeToStart} to start, about ${duration}` : `${timeToStart} to start`;
}
