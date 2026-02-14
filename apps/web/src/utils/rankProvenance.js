export const SOURCE_TAGS = {
  LIVE: "Live data",
  HYBRID: "Hybrid",
  ESTIMATED: "Estimated"
};

export const SOURCE_HINTS = {
  [SOURCE_TAGS.LIVE]: "From latest rank-check response.",
  [SOURCE_TAGS.HYBRID]: "Blend of live rank signals and modeled estimates.",
  [SOURCE_TAGS.ESTIMATED]: "Modeled from SERP/rank patterns."
};

const OBSERVED_FACTS_INTRO = {
  rankMovementExplanation: {
    [SOURCE_TAGS.LIVE]: "Observed facts from live rank-change signals.",
    [SOURCE_TAGS.HYBRID]: "Observed facts combine live rank changes with partial live competitor context.",
    [SOURCE_TAGS.ESTIMATED]: "Observed facts are limited; most movement context is modeled."
  },
  trendStory: {
    [SOURCE_TAGS.LIVE]: "Observed facts from direct trend checks.",
    [SOURCE_TAGS.HYBRID]: "Observed facts from recent rank history checks.",
    [SOURCE_TAGS.ESTIMATED]: "Observed facts are not sufficient; trend context is modeled."
  },
  keywordOpportunity: {
    [SOURCE_TAGS.LIVE]: "Observed facts returned from live rank-check metrics.",
    [SOURCE_TAGS.HYBRID]: "Observed facts include partial live metrics; missing fields use modeled fill-ins.",
    [SOURCE_TAGS.ESTIMATED]: "Observed facts are limited for this card; values are primarily modeled."
  },
  actionableRecipe: {
    [SOURCE_TAGS.LIVE]: "Observed facts from live optimization guidance.",
    [SOURCE_TAGS.HYBRID]: "Observed facts are mixed with modeled recommendations.",
    [SOURCE_TAGS.ESTIMATED]: "Observed facts come from current rank context; recipe steps are modeled."
  }
};

const MODELED_RECOMMENDATION_INTRO = {
  rankMovementExplanation: {
    [SOURCE_TAGS.LIVE]: "Modeled recommendations to compound the observed movement.",
    [SOURCE_TAGS.HYBRID]: "Modeled recommendations based on mixed live and estimated signals.",
    [SOURCE_TAGS.ESTIMATED]: "Modeled recommendations inferred from pattern-based estimates."
  },
  trendStory: {
    [SOURCE_TAGS.LIVE]: "Modeled recommendations based on short-term trend momentum.",
    [SOURCE_TAGS.HYBRID]: "Modeled recommendations based on trend volatility and segment patterns.",
    [SOURCE_TAGS.ESTIMATED]: "Modeled recommendations inferred from historical pattern estimates."
  },
  keywordOpportunity: {
    [SOURCE_TAGS.LIVE]: "Modeled recommendations built on live metric baselines.",
    [SOURCE_TAGS.HYBRID]: "Modeled recommendations account for mixed-source metric confidence.",
    [SOURCE_TAGS.ESTIMATED]: "Modeled recommendations inferred from keyword and SERP patterns."
  },
  actionableRecipe: {
    [SOURCE_TAGS.LIVE]: "Modeled recommendations to sequence high-impact actions.",
    [SOURCE_TAGS.HYBRID]: "Modeled recommendations based on mixed-source opportunity signals.",
    [SOURCE_TAGS.ESTIMATED]: "Modeled recommendations to use as a planning draft."
  }
};

const SCENARIO_ESTIMATE_LABELS = {
  traffic_gained: "Scenario estimate",
  monthly_visits: "Scenario estimate",
  ctr_lift: "Scenario estimate",
  cumulative_lift: "Scenario estimate if completed",
  clicks_opportunity: "Scenario estimate"
};

function isFinitePositive(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function hasText(value) {
  return String(value || "").trim().length > 0;
}

function isCompleteCompetitorRow(entry) {
  return hasText(entry?.domain) && isFinitePositive(entry?.position);
}

function isCompleteSerpRow(entry) {
  const domain = hasText(entry?.domain) || hasText(entry?.url);
  return (
    isFinitePositive(entry?.position) &&
    hasText(entry?.title) &&
    hasText(entry?.type) &&
    hasText(entry?.description) &&
    domain
  );
}

function isLiveSerpSnippet(entry) {
  const raw = String(
    entry?.snippetSource
    || entry?.snippet_source
    || entry?.snippetProvenance
    || entry?.snippet_provenance
    || entry?.source
    || ""
  ).trim().toLowerCase();
  if (raw) {
    return raw.includes("live");
  }
  return (
    entry?.isLiveSnippet === true
    || entry?.is_live_snippet === true
    || entry?.liveSnippet === true
  );
}

export function evaluateSeoProgressDashboard({ activeSnapshotScore, latestRankValue }) {
  if (isFinitePositive(activeSnapshotScore) && isFinitePositive(latestRankValue)) return SOURCE_TAGS.HYBRID;
  return SOURCE_TAGS.ESTIMATED;
}

export function evaluateRankMovementExplanation({ rankDelta, hasLiveTopCompetitors }) {
  const hasLiveDelta = rankDelta !== null && rankDelta !== undefined && Number.isFinite(Number(rankDelta));
  if (hasLiveDelta && hasLiveTopCompetitors) return SOURCE_TAGS.HYBRID;
  if (hasLiveDelta) return SOURCE_TAGS.LIVE;
  if (hasLiveTopCompetitors) return SOURCE_TAGS.HYBRID;
  return SOURCE_TAGS.ESTIMATED;
}

export function evaluateTrendStory({ checksCount }) {
  if (Number(checksCount) >= 2) return SOURCE_TAGS.HYBRID;
  return SOURCE_TAGS.ESTIMATED;
}

export function evaluateActionableRecipe() {
  return SOURCE_TAGS.ESTIMATED;
}

export function evaluateKeywordOpportunity({ difficultyScore, trafficPotential, opportunityScore, liveRankReasonsCount }) {
  const liveMetrics = [
    isFinitePositive(difficultyScore),
    isFinitePositive(trafficPotential),
    isFinitePositive(opportunityScore)
  ];
  const liveCount = liveMetrics.filter(Boolean).length;
  const hasLiveReasons = Number(liveRankReasonsCount) > 0;

  if (liveCount === 3) return SOURCE_TAGS.LIVE;
  if (liveCount > 0 || hasLiveReasons) return SOURCE_TAGS.HYBRID;
  return SOURCE_TAGS.ESTIMATED;
}

export function evaluateCompetitorSnapshot({ topCompetitors }) {
  const rows = Array.isArray(topCompetitors) ? topCompetitors : [];
  if (!rows.length) return SOURCE_TAGS.ESTIMATED;
  const completeRows = rows.filter(isCompleteCompetitorRow).length;
  if (completeRows >= 3) return SOURCE_TAGS.LIVE;
  if (completeRows > 0) return SOURCE_TAGS.HYBRID;
  return SOURCE_TAGS.ESTIMATED;
}

export function evaluateSerpSnapshot({ serpPreviewRaw }) {
  const rows = Array.isArray(serpPreviewRaw) ? serpPreviewRaw : [];
  if (!rows.length) return SOURCE_TAGS.ESTIMATED;
  const liveCompleteRows = rows.filter((row) => isCompleteSerpRow(row) && isLiveSerpSnippet(row)).length;
  if (liveCompleteRows === rows.length) return SOURCE_TAGS.LIVE;
  if (liveCompleteRows > 0) return SOURCE_TAGS.HYBRID;
  return SOURCE_TAGS.ESTIMATED;
}

export function evaluateBacklinkComparison() {
  return SOURCE_TAGS.ESTIMATED;
}

export function evaluateContentGap() {
  return SOURCE_TAGS.ESTIMATED;
}

export function getKeywordOpportunitySourceCopy(tag) {
  if (tag === SOURCE_TAGS.LIVE) return "Metrics returned from live rank-check response.";
  if (tag === SOURCE_TAGS.HYBRID) return "Mixed source: some metrics are live while missing fields are estimated.";
  return "Benchmark model based on current keyword and SERP profile.";
}

export function getSerpSnapshotSourceCopy(tag) {
  if (tag === SOURCE_TAGS.LIVE) return "Observed live SERP rows from this check.";
  if (tag === SOURCE_TAGS.HYBRID) return "Observed partial live rows; remaining snippet details are modeled.";
  return "Modeled preview from current signals.";
}

export function getObservedFactsIntro(tag, cardKey) {
  return OBSERVED_FACTS_INTRO?.[cardKey]?.[tag] || OBSERVED_FACTS_INTRO?.[cardKey]?.[SOURCE_TAGS.ESTIMATED] || "";
}

export function getModeledRecommendationIntro(tag, cardKey) {
  return MODELED_RECOMMENDATION_INTRO?.[cardKey]?.[tag] || MODELED_RECOMMENDATION_INTRO?.[cardKey]?.[SOURCE_TAGS.ESTIMATED] || "";
}

export function getScenarioEstimateLabel(metricKey) {
  return SCENARIO_ESTIMATE_LABELS[metricKey] || "Scenario estimate";
}

export function buildRankProvenance({
  activeSnapshotScore,
  latestRankValue,
  rankDelta,
  previousRank,
  topCompetitors,
  serpPreviewRaw,
  difficultyScore,
  trafficPotential,
  opportunityScore,
  liveRankReasonsCount,
  trendChecksCount
} = {}) {
  const competitorTag = evaluateCompetitorSnapshot({ topCompetitors });
  const hasLiveCheckpoint = Number.isFinite(Number(previousRank)) && Number(previousRank) > 0;
  const rankMovementTag = evaluateRankMovementExplanation({
    rankDelta: hasLiveCheckpoint ? rankDelta : null,
    hasLiveTopCompetitors: competitorTag !== SOURCE_TAGS.ESTIMATED
  });
  return {
    seoProgressDashboard: evaluateSeoProgressDashboard({ activeSnapshotScore, latestRankValue }),
    rankMovementExplanation: rankMovementTag,
    trendStory: evaluateTrendStory({ checksCount: trendChecksCount }),
    keywordOpportunity: evaluateKeywordOpportunity({
      difficultyScore,
      trafficPotential,
      opportunityScore,
      liveRankReasonsCount
    }),
    competitorSnapshot: competitorTag,
    serpSnapshot: evaluateSerpSnapshot({ serpPreviewRaw }),
    backlinkComparison: evaluateBacklinkComparison(),
    contentGap: evaluateContentGap(),
    actionableRecipe: evaluateActionableRecipe()
  };
}
