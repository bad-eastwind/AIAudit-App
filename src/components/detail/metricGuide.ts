// Metric definitions + per-model readings for the Faithfulness and Proof cards.
// Every judge() turns a raw number into a level plus a sentence about THIS model.

export type Level = 'good' | 'ok' | 'warn' | 'bad' | 'na'

export interface MetricReading {
  id: string
  name: string
  value: string
  level: Level
  /** What this number says about the selected model. */
  forModel: string
  /** What the metric measures, in plain words. */
  what: string
  /** How to read the scale. */
  scale: string
}

const isNum = (v: unknown): v is number => typeof v === 'number' && isFinite(v)
const f = (v: number, d = 3) => v.toFixed(d)
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

// ---------------------------------------------------------------- faithfulness

export interface FaithfulnessSummary {
  readings: MetricReading[]
  bottomLine: string
  level: Level
}

export function readFaithfulness(fa: Record<string, unknown>, model: string): FaithfulnessSummary {
  const auc = isNum(fa.auc) ? fa.auc : null
  const lo = isNum(fa.ci_lower) ? fa.ci_lower : null
  const hi = isNum(fa.ci_upper) ? fa.ci_upper : null
  const method = typeof fa.method === 'string' ? fa.method : 'the attribution method'
  const layers = Array.isArray(fa.per_layer_correlations)
    ? (fa.per_layer_correlations as Array<[string, number]>).filter((l) => isNum(l[1]))
    : []
  const rank = (fa.rank_correlation ?? null) as Record<string, unknown> | null
  const spearman = rank && isNum(rank.spearman) ? rank.spearman : null
  const kendall = rank && isNum(rank.kendall) ? rank.kendall : null
  const ssim = Array.isArray(fa.ssim_curve) ? (fa.ssim_curve as number[]).filter(isNum) : []
  const topk = Array.isArray(fa.topk_overlap) ? (fa.topk_overlap as number[]).filter(isNum) : []

  const dead = layers.filter((l) => Math.abs(l[1]) < 1e-9).length
  const ssimMean = ssim.length ? mean(ssim) : null
  const topkMean = topk.length ? mean(topk) : null

  const readings: MetricReading[] = []

  // AUC
  {
    let level: Level = 'na'
    let note = 'Not computed for this model.'
    if (auc !== null) {
      if (auc >= 0.9) {
        level = 'good'
        note = `${model}'s heatmap collapses almost completely once its weights are scrambled. The picture depends on what the model learned, which is what you want.`
      } else if (auc >= 0.7) {
        level = 'ok'
        note = `${model}'s heatmap mostly falls apart when scrambled, but some of it survives. Mostly trustworthy, not airtight.`
      } else if (auc > 0.5) {
        level = 'warn'
        note = `A large part of ${model}'s heatmap survives scrambling, so it may reflect the image or the method more than the model.`
      } else {
        level = 'bad'
        note = `${model}'s heatmap barely changes when the model is destroyed. It is decorative: do not use it as evidence.`
      }
    }
    readings.push({
      id: 'auc',
      name: 'Faithfulness AUC',
      value: auc !== null ? f(auc) : 'N/A',
      level,
      forModel: note,
      what:
        'Scrambles the model layer by layer (output side first) and re-draws the heatmap each time. AUC = 1 minus the average correlation with the original heatmap.',
      scale: '1.0 = heatmap destroyed with the model (faithful). 0.5 = coin flip. Near 0 = heatmap ignores the model entirely.',
    })
  }

  // CI
  {
    let level: Level = 'na'
    let note = 'No confidence interval reported.'
    if (lo !== null && hi !== null) {
      if (hi - lo < 1e-9) {
        level = 'warn'
        note = `The interval has zero width (${f(lo)} to ${f(hi)}). That usually means too few cascade stages (${layers.length}) or identical values, so the precision is unmeasured, not perfect.`
      } else if (lo > 0.4) {
        level = lo >= 0.7 ? 'good' : 'ok'
        note = `Even the pessimistic end (${f(lo)}) clears the 0.4 bar the verdict rule requires, so the verdict is not a lucky draw.`
      } else {
        level = 'warn'
        note = `The pessimistic end (${f(lo)}) is at or below 0.4, so the data cannot rule out an unfaithful explanation.`
      }
    }
    readings.push({
      id: 'ci',
      name: '95% confidence interval',
      value: lo !== null && hi !== null ? `${f(lo)} to ${f(hi)}` : 'N/A',
      level,
      forModel: note,
      what: 'Bootstrap range for the AUC: how much it would move if the audit were repeated on different resamples.',
      scale:
        'Narrow and high = reliable. The verdict is "faithful" only if AUC > 0.5 AND the lower end > 0.4. Wide = few samples.',
    })
  }

  // Cascade layers
  {
    let level: Level = 'na'
    let note = 'No per-layer data.'
    if (layers.length) {
      if (dead >= 2 && dead >= layers.length - 1) {
        level = 'warn'
        note = `${dead} of ${layers.length} stages read exactly 0.0. That can mean the heatmap went blank after the first scramble (nothing left to correlate), which pushes AUC up artificially. A real measurement decays gradually.`
      } else if (layers.length < 4) {
        level = 'warn'
        note = `Only ${layers.length} stages were scrambled, so the curve is a thin sample of the network.`
      } else {
        level = 'good'
        note = `${layers.length} stages tested, with a spread of correlations. Read the chart: values should fall toward 0 as more layers are scrambled.`
      }
    }
    readings.push({
      id: 'layers',
      name: 'Per-layer correlation',
      value: layers.length ? `${layers.length} stages` : 'N/A',
      level,
      forModel: note,
      what: 'Correlation between the original heatmap and the heatmap after scrambling up to each named layer (top of the network first).',
      scale: 'Near 1 = heatmap unchanged (bad sign). Near 0 = heatmap unrelated to the original (good). Negative = flipped.',
    })
  }

  // Rank correlations
  for (const [id, name, v] of [
    ['spearman', 'Spearman rank score', spearman],
    ['kendall', 'Kendall rank score', kendall],
  ] as const) {
    let level: Level = 'na'
    let note = 'Not computed.'
    if (v !== null) {
      level = v >= 0.7 ? 'good' : v >= 0.5 ? 'ok' : 'warn'
      note =
        v >= 0.7
          ? `The ordering of which pixels matter most is lost after scrambling, as it should be.`
          : `The pixel ranking partly survives scrambling, so some structure may not come from the model.`
    }
    readings.push({
      id,
      name,
      value: v !== null ? f(v) : 'N/A',
      level,
      forModel: note,
      what: 'Same test as AUC but on pixel rank order (which pixels rank as most important) instead of raw values.',
      scale: 'Higher = ranking destroyed by scrambling = faithful. Same 0.5 coin-flip line as AUC.',
    })
  }

  // SSIM
  {
    let level: Level = 'na'
    let note = 'No SSIM data.'
    if (ssimMean !== null) {
      level = ssimMean <= 0.3 ? 'good' : ssimMean <= 0.6 ? 'ok' : 'warn'
      note =
        ssimMean <= 0.6
          ? `On average the scrambled heatmaps look structurally different (similarity ${f(ssimMean, 2)}).`
          : `Scrambled heatmaps still look ${f(ssimMean * 100, 0)}% similar to the original on average.` +
            (auc !== null && auc >= 0.9 ? ' This disagrees with the high AUC, so treat the AUC with care.' : '')
    }
    readings.push({
      id: 'ssim',
      name: 'Mean SSIM (lower is better)',
      value: ssimMean !== null ? f(ssimMean) : 'N/A',
      level,
      forModel: note,
      what: 'Structural similarity between the original heatmap and each scrambled one, judged like an image comparison.',
      scale: '0 = completely different picture (good). 1 = identical picture (bad: model was not needed).',
    })
  }

  // Top-k overlap
  {
    let level: Level = 'na'
    let note = 'No overlap data.'
    if (topkMean !== null) {
      level = topkMean <= 0.15 ? 'good' : topkMean <= 0.4 ? 'ok' : 'warn'
      note = `${f(topkMean * 100, 0)}% of the top-10% hottest pixels stay the same after scrambling. Pure chance would give 10%.`
    }
    readings.push({
      id: 'topk',
      name: 'Top-10% pixel overlap (lower is better)',
      value: topkMean !== null ? f(topkMean) : 'N/A',
      level,
      forModel: note,
      what: 'Of the pixels the heatmap calls most important, how many are still called most important after scrambling.',
      scale: '0.10 = chance level. Well above 0.10 = the hot spots survive without the model (bad).',
    })
  }

  // Bottom line
  let bottomLine = `No faithfulness result for ${model}.`
  let level: Level = 'na'
  if (auc !== null) {
    const caveats: string[] = []
    if (hi !== null && lo !== null && hi - lo < 1e-9) caveats.push('the confidence interval has no width')
    if (dead >= 2 && dead >= layers.length - 1) caveats.push('most cascade stages read exactly 0.0')
    if (ssimMean !== null && ssimMean > 0.6 && auc >= 0.9) caveats.push('SSIM disagrees with AUC')
    level = auc >= 0.9 && !caveats.length ? 'good' : auc > 0.5 ? (caveats.length ? 'warn' : 'ok') : 'bad'
    if (auc <= 0.5) {
      bottomLine = `Using ${method}, ${model}'s explanation does not depend on the model's learned weights (AUC ${f(auc, 2)}). Treat it as decoration.`
    } else if (caveats.length) {
      bottomLine = `The headline reads faithful (AUC ${f(auc, 2)} with ${method}), but the evidence is shaky: ${caveats.join('; ')}. Do not lean on this verdict yet.`
    } else {
      bottomLine = `Using ${method}, ${model}'s explanation depends on the model's learned weights (AUC ${f(auc, 2)}).`
    }
  }

  return { readings, bottomLine, level }
}

// ----------------------------------------------------------------------- proof

export interface ProofSummary {
  calibration: MetricReading[]
  selective: MetricReading[]
  failure: MetricReading[]
  bottomLine: string
  level: Level
}

export function readProof(proof: Record<string, unknown>, model: string): ProofSummary {
  const ece = isNum(proof.ece) ? proof.ece : null
  const eceAfter = isNum(proof.ece_after_temp_scaling) ? proof.ece_after_temp_scaling : null
  const temp = isNum(proof.temperature) ? proof.temperature : null
  const brier = isNum(proof.brier_score) ? proof.brier_score : null
  const aurc = isNum(proof.aurc) ? proof.aurc : null
  const eAurc = isNum(proof.e_aurc) ? proof.e_aurc : null
  const auroc = isNum(proof.misclassification_auroc) ? proof.misclassification_auroc : null

  const nearlyAllWrong = aurc !== null && aurc >= 0.9

  const calibration: MetricReading[] = []
  const selective: MetricReading[] = []
  const failure: MetricReading[] = []

  // ECE
  {
    let level: Level = 'na'
    let note = 'Not computed.'
    if (ece !== null) {
      level = ece < 0.05 ? 'good' : ece < 0.15 ? 'warn' : 'bad'
      note =
        ece < 0.05
          ? `When ${model} says "90% sure" it is right close to 90% of the time (gap ${f(ece * 100, 1)} points).`
          : `${model}'s stated confidence is off from its real accuracy by about ${f(ece * 100, 1)} points on average.`
    }
    calibration.push({
      id: 'ece',
      name: 'ECE (before scaling)',
      value: ece !== null ? f(ece, 4) : 'N/A',
      level,
      forModel: note,
      what: 'Expected Calibration Error: groups predictions by confidence and averages the gap between confidence and actual accuracy.',
      scale: '0 = perfectly honest confidence. Under 0.05 is good, over 0.15 is poor. Max 1.',
    })
  }

  // ECE after
  {
    let level: Level = 'na'
    let note = 'Not computed.'
    if (eceAfter !== null) {
      level = eceAfter < 0.05 ? 'good' : eceAfter < 0.15 ? 'warn' : 'bad'
      note =
        ece !== null
          ? `One temperature knob moves ECE from ${f(ece, 4)} to ${f(eceAfter, 4)}.` +
            (temp !== null && temp >= 19.9
              ? ' The knob was pushed to its limit, so it mostly flattened the confidence rather than truly fixing it.'
              : '')
          : `After rescaling, the gap is ${f(eceAfter, 4)}.`
    }
    calibration.push({
      id: 'ece_after',
      name: 'ECE (after temperature scaling)',
      value: eceAfter !== null ? f(eceAfter, 4) : 'N/A',
      level,
      forModel: note,
      what: 'Same calibration error after dividing the model logits by one fitted number (the temperature).',
      scale: 'A big drop from the "before" value means the model was fixably over- or under-confident.',
    })
  }

  // Temperature
  {
    let level: Level = 'na'
    let note = 'Not fitted.'
    if (temp !== null) {
      if (temp <= 0.051) {
        level = 'bad'
        note = `T hit the lower search limit (0.05). The fit wanted to sharpen ${model}'s probabilities even more: it is far less confident than it is accurate on this audit set.`
      } else if (temp >= 19.9) {
        level = 'bad'
        note = `T hit the search limit (20). The fit wanted an even higher value: ${model}'s confidence is essentially unrelated to being right on this audit set.`
      } else if (temp > 1.5) {
        level = 'warn'
        note = `T = ${f(temp, 2)}: ${model} is overconfident and needs its confidence softened.`
      } else if (temp < 0.7) {
        level = 'warn'
        note = `T = ${f(temp, 2)}: ${model} is underconfident and could be sharpened.`
      } else {
        level = 'good'
        note = `T = ${f(temp, 2)}, close to 1: ${model}'s raw confidence is already about right.`
      }
    }
    calibration.push({
      id: 'temp',
      name: 'Temperature',
      value: temp !== null ? f(temp, 2) : 'N/A',
      level,
      forModel: note,
      what: 'The single number the logits are divided by to make confidence honest.',
      scale: '1 = already calibrated. Above 1 = overconfident model. Below 1 = underconfident. The search runs from 0.05 to 20.',
    })
  }

  // Brier
  {
    let level: Level = 'na'
    let note = 'Not computed.'
    if (brier !== null) {
      if (brier >= 1.5) {
        level = 'bad'
        note = `Near the worst possible value: ${model} is confidently wrong on most examples.`
      } else if (brier >= 0.9) {
        level = 'bad'
        note = `About what pure guessing scores with many classes. ${model} is not beating chance on this audit set.`
      } else if (brier >= 0.3) {
        level = 'warn'
        note = `Middling: ${model} is right often enough to help, but its probabilities are not sharp.`
      } else {
        level = 'good'
        note = `Low: ${model}'s probabilities are both accurate and well-judged.`
      }
    }
    calibration.push({
      id: 'brier',
      name: 'Brier score',
      value: brier !== null ? f(brier, 4) : 'N/A',
      level,
      forModel: note,
      what: 'Mean squared distance between the predicted probabilities and the true answer. Punishes confident mistakes hard.',
      scale: '0 = perfect. Uniform guessing over many classes is about 1.0. The maximum is 2.',
    })
  }

  // AURC
  {
    let level: Level = 'na'
    let note = 'Selective-risk metrics were not computed in this run.'
    if (aurc !== null) {
      if (nearlyAllWrong) {
        level = 'bad'
        note = `About ${f(aurc * 100, 1)}% error even after keeping only the most confident predictions: nearly every prediction on this audit set was wrong.`
      } else if (aurc < 0.1) {
        level = 'good'
        note = `Low risk: abstaining on the least confident cases leaves ${model} making very few mistakes.`
      } else {
        level = 'warn'
        note = `Moderate risk: even the confident predictions of ${model} carry a noticeable error rate.`
      }
    }
    selective.push({
      id: 'aurc',
      name: 'AURC',
      value: aurc !== null ? f(aurc, 4) : 'N/A',
      level,
      forModel: note,
      what: 'Area Under the Risk-Coverage curve: average error when the model may skip its least confident cases, over every skip level.',
      scale: '0 = never wrong. Roughly equals the overall error rate when confidence carries no signal. Lower is better.',
    })
  }

  // E-AURC
  {
    let level: Level = 'na'
    let note = 'Not computed.'
    if (eAurc !== null) {
      if (nearlyAllWrong && eAurc < 1e-9) {
        level = 'warn'
        note = `0.0 here is not a win. When every prediction is wrong there is nothing to reorder, so no ranking can do better. Read it together with the AURC.`
      } else if (eAurc <= 0.02) {
        level = 'good'
        note = `${model}'s confidence ranks its own mistakes almost as well as an oracle would.`
      } else if (eAurc <= 0.1) {
        level = 'ok'
        note = `Confidence ranking is decent but leaves some avoidable errors.`
      } else {
        level = 'warn'
        note = `Confidence is a poor guide to which cases to skip.`
      }
    }
    selective.push({
      id: 'eaurc',
      name: 'E-AURC',
      value: eAurc !== null ? f(eAurc, 4) : 'N/A',
      level,
      forModel: note,
      what: 'AURC minus the best AURC any confidence ranking could reach with this accuracy. Isolates how good the ranking is.',
      scale: '0 = ranking is as good as an oracle. Larger = confidence is a worse guide. Lower is better.',
    })
  }

  // AUROC
  {
    let level: Level = 'na'
    let note =
      'Not computed. It needs a mix of correct and incorrect predictions to compare, and this run did not provide one.'
    if (auroc !== null) {
      level = auroc >= 0.8 ? 'good' : auroc >= 0.65 ? 'ok' : auroc >= 0.55 ? 'warn' : 'bad'
      note =
        auroc >= 0.65
          ? `Picking one right and one wrong prediction at random, ${model}'s confidence is lower on the wrong one ${f(auroc * 100, 0)}% of the time.`
          : `${model}'s confidence barely separates its right answers from its wrong ones.`
    }
    failure.push({
      id: 'auroc',
      name: 'Misclassification AUROC',
      value: auroc !== null ? f(auroc, 4) : 'N/A',
      level,
      forModel: note,
      what: "Can the model's own confidence tell you which predictions are wrong?",
      scale: '0.5 = no better than a coin flip. 0.8+ = useful warning signal. 1.0 = perfect.',
    })
  }

  // Bottom line
  const all = [...calibration, ...selective, ...failure]
  const judged = all.filter((r) => r.level !== 'na')
  let bottomLine = `No proof-suite metrics were computed for ${model}.`
  let level: Level = 'na'
  if (judged.length) {
    const bad = judged.filter((r) => r.level === 'bad').length
    const warn = judged.filter((r) => r.level === 'warn').length
    level = bad >= 2 ? 'bad' : bad + warn > 0 ? 'warn' : 'good'
    bottomLine =
      level === 'good'
        ? `${model}'s confidence can be taken at face value: calibration and selective-risk numbers all look healthy.`
        : `${bad} bad and ${warn} cautionary readings out of ${judged.length}.`
  }

  return { calibration, selective, failure, bottomLine, level }
}
