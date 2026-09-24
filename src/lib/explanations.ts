// Plain-language copy for each audit card. Written for a reader who has just
// finished the paper: no symbols without a translation, one idea per line.

export interface CardExplanation {
  /** One sentence, shown always under the card title. */
  tagline: string
  /** What the audit step actually does. */
  what: string
  /** How to read the big number / badge. */
  read: string
  /** Why a clinician or reviewer should care. */
  why: string
  /** Short jargon -> plain-English pairs. */
  terms: { term: string; plain: string }[]
  /** Paper section for readers who want the math. */
  paper: string
}

export const EXPLANATIONS: Record<'trust' | 'fac' | 'acs' | 'udag' | 'closure', CardExplanation> = {
  trust: {
    tagline: 'One number: how much should you believe this model on this input?',
    what:
      'The audit collects several warning signals (is the explanation faithful, is the input unusual, is the model unsure). ' +
      'A small learned model, trained on past failures, turns those signals into a single trust score.',
    read:
      '100 means all signals look healthy. With the default cut-offs: green (70+) = reliable, amber (40-69) = use caution, red (below 40) = flag for a human to review.',
    why:
      'A plain average of signals can hide a serious problem behind several good ones. This score is learned from real failures, so it tracks "will this be wrong?" directly.',
    terms: [
      { term: 'Signal', plain: 'one measurable warning sign, e.g. low confidence or out-of-distribution input' },
      { term: 'Failure discriminator', plain: 'a tiny classifier that predicts "this prediction is probably wrong"' },
      { term: 'Trust', plain: '1 minus the predicted chance of failure' },
    ],
    paper: 'Section 9: Information-theoretic trust',
  },
  fac: {
    tagline: 'A promise about how often the prediction set contains the right answer.',
    what:
      'Instead of one label, the model returns a small set of possible labels. Conformal prediction tunes the set size so it contains the truth a chosen fraction of the time. ' +
      'FAC adds a twist: calibration leans on examples whose explanations were faithful, so the guarantee is tied to explanation quality.',
    read:
      'The big number is the guaranteed minimum coverage. 0.85 means: at least 85 out of 100 new cases will have the true answer inside the set. ' +
      'It equals (1 - alpha) minus a penalty of 2 x skew.',
    why:
      'This is a promise you can check, not a hope. A lower bound with a clear penalty tells you exactly how much the faithfulness weighting cost you.',
    terms: [
      { term: 'alpha', plain: 'the error rate you allow, e.g. 0.10 means "wrong at most 10% of the time"' },
      { term: 'Skew', plain: 'how unevenly the calibration examples were weighted; more skew = weaker guarantee' },
      { term: 'n_calib', plain: 'number of calibration examples; more means a tighter, more stable guarantee' },
      { term: 'Note badge', plain: '"valid" = guarantee holds; "weakened" = skew is large, so treat the bound as loose' },
    ],
    paper: 'Section 5: FAC theory',
  },
  acs: {
    tagline: 'A promise about where the model looked: the important region is inside the highlighted area.',
    what:
      'Explanation maps (heatmaps) show where the model looked. ACS turns a heatmap into a region with a guarantee: ' +
      'with a chosen probability, the truly important area lies inside the selected region.',
    read:
      'q_hat is the calibrated cut-off that decides how much of the heatmap to keep. Coverage is how often the true region was captured. ' +
      'Mean set fraction is how much of the image the region takes up: smaller is sharper. At 100% the region is the whole image, so the promise is true but says nothing useful.',
    why:
      'A heatmap alone is a picture. ACS makes it a claim you can test: "the evidence for this decision is in here", with a stated failure rate.',
    terms: [
      { term: 'Attribution', plain: 'a heatmap of which pixels mattered for the prediction' },
      { term: 'q_hat', plain: 'the calibrated threshold that sets how big the region must be' },
      { term: 'Set fraction', plain: 'share of the image inside the region' },
      { term: 'Not calibrated', plain: 'needs ground-truth regions (e.g. segmentation masks) to calibrate against' },
    ],
    paper: 'Section 6: ACS theory',
  },
  udag: {
    tagline: 'Four kinds of doubt, kept separate, so you can see WHY the audit is unsure.',
    what:
      'Uncertainty is not one thing. UDAG splits it into four axes and chains them: can the image even be read (Visual), ' +
      'is the model confused between classes (Diagnostic), does the answer stay steady over time (Temporal), ' +
      'and can the explanation itself be believed (Explanatory). Doubt at an earlier axis raises the floor for the next one.',
    read:
      'Each bar is uncertainty: shorter is better. Reliability is the summary: 1 minus the worst of Visual, Diagnostic and Temporal, ' +
      'then scaled down further if the explanation is unfaithful. Higher reliability is better.',
    why:
      'One blended number cannot tell you whether to fix the scan, retrain the model, or distrust the heatmap. Separate axes point at the cause.',
    terms: [
      { term: 'Visual_U', plain: 'image readability: noise, blur, out-of-distribution input' },
      { term: 'Diagnostic_U', plain: 'class confusion: entropy and model disagreement' },
      { term: 'Temporal_U', plain: 'instability across video frames; not applicable to single images' },
      { term: 'Explanatory_U', plain: 'how unfaithful the explanation is (from the Adebayo randomization test)' },
      { term: 'Floor gate', plain: 'if an earlier axis is above its gate, later axes cannot report less doubt than it' },
    ],
    paper: 'Section 8: UDAG axes',
  },
  closure: {
    tagline: 'Does a tiny change in the input cause a tiny change in the audit result?',
    what:
      'The audit is a chain of steps: explain, check faithfulness, build sets, score trust. Closure nudges the input slightly and measures how much each step moves. ' +
      'It then adds the per-step sensitivities to get one bound for the whole chain.',
    read:
      'L_chain is the total sensitivity: lower is steadier. [PASS] means it stays under the tolerance (tol). [FAIL] means small input noise could swing the verdict, so do not lean on it.',
    why:
      'An audit that flips verdict when one pixel changes cannot be trusted. Closure checks the auditor itself, not just the model.',
    terms: [
      { term: 'Lipschitz constant (L)', plain: 'how much the output can change per unit change of input' },
      { term: 'Probes', plain: 'the number of small random nudges used to estimate L' },
      { term: 'Tolerance', plain: 'the largest L you are willing to accept' },
      { term: 'Stage', plain: 'one step of the audit chain; the bar below shows each stage share' },
    ],
    paper: 'Section 7: Closure theory',
  },
}
