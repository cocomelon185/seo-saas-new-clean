import { expect, test } from "@playwright/test";
import {
  SOURCE_TAGS,
  buildRankProvenance,
  getModeledRecommendationIntro,
  getObservedFactsIntro,
  getKeywordOpportunitySourceCopy,
  getScenarioEstimateLabel,
  getSerpSnapshotSourceCopy
} from "../src/utils/rankProvenance.js";

function baseInput(overrides = {}) {
  return {
    activeSnapshotScore: null,
    latestRankValue: 29,
    rankDelta: null,
    previousRank: null,
    topCompetitors: [],
    serpPreviewRaw: [],
    difficultyScore: null,
    trafficPotential: null,
    opportunityScore: null,
    liveRankReasonsCount: 0,
    trendChecksCount: 1,
    ...overrides
  };
}

test("full live payload yields Live tags for competitor, SERP, and opportunity cards", async () => {
  const provenance = buildRankProvenance(baseInput({
    rankDelta: 11,
    previousRank: 29,
    topCompetitors: [
      { domain: "ahrefs.com", position: 1 },
      { domain: "semrush.com", position: 2 },
      { domain: "moz.com", position: 3 }
    ],
    serpPreviewRaw: [
      { position: 1, title: "Result A", domain: "a.com", type: "Organic", description: "Live snippet one.", snippetSource: "Live snippet" },
      { position: 2, title: "Result B", domain: "b.com", type: "Organic", description: "Live snippet two.", snippetSource: "Live snippet" }
    ],
    difficultyScore: 67,
    trafficPotential: 1036,
    opportunityScore: 54
  }));

  expect(provenance.competitorSnapshot).toBe(SOURCE_TAGS.LIVE);
  expect(provenance.serpSnapshot).toBe(SOURCE_TAGS.LIVE);
  expect(provenance.keywordOpportunity).toBe(SOURCE_TAGS.LIVE);
  expect(provenance.rankMovementExplanation).toBe(SOURCE_TAGS.HYBRID);
  expect(getSerpSnapshotSourceCopy(provenance.serpSnapshot)).toBe("Observed live SERP rows from this check.");
  expect(getKeywordOpportunitySourceCopy(provenance.keywordOpportunity)).toBe("Metrics returned from live rank-check response.");
});

test("partial live SERP rows map to Hybrid with mixed-source copy", async () => {
  const provenance = buildRankProvenance(baseInput({
    serpPreviewRaw: [
      { position: 1, title: "Result A", domain: "a.com", type: "Organic", description: "Live snippet one.", snippetSource: "Live snippet" },
      { position: 2, title: "Result B", domain: "b.com", type: "Organic", description: "Modeled snippet.", snippetSource: "Estimated snippet" }
    ]
  }));

  expect(provenance.serpSnapshot).toBe(SOURCE_TAGS.HYBRID);
  expect(getSerpSnapshotSourceCopy(provenance.serpSnapshot)).toBe("Observed partial live rows; remaining snippet details are modeled.");
});

test("partial metric coverage is never Live for keyword opportunity", async () => {
  const provenance = buildRankProvenance(baseInput({
    difficultyScore: 64,
    trafficPotential: null,
    opportunityScore: null
  }));

  expect(provenance.keywordOpportunity).toBe(SOURCE_TAGS.HYBRID);
  expect(getKeywordOpportunitySourceCopy(provenance.keywordOpportunity)).toBe(
    "Mixed source: some metrics are live while missing fields are estimated."
  );
});

test("backlink comparison and content gap remain Estimated in frontend-only phase", async () => {
  const provenance = buildRankProvenance(baseInput({
    topCompetitors: [{ domain: "ahrefs.com", position: 1 }],
    serpPreviewRaw: [{ position: 1, title: "Result A", domain: "a.com", type: "Organic", description: "Live snippet one.", snippetSource: "Live snippet" }]
  }));

  expect(provenance.backlinkComparison).toBe(SOURCE_TAGS.ESTIMATED);
  expect(provenance.contentGap).toBe(SOURCE_TAGS.ESTIMATED);
});

test("SEO Progress Dashboard is Hybrid only when rank and snapshot blend are both present", async () => {
  const blended = buildRankProvenance(baseInput({
    activeSnapshotScore: 72,
    latestRankValue: 18
  }));
  const estimatedOnly = buildRankProvenance(baseInput({
    activeSnapshotScore: null,
    latestRankValue: 18
  }));

  expect(blended.seoProgressDashboard).toBe(SOURCE_TAGS.HYBRID);
  expect(estimatedOnly.seoProgressDashboard).toBe(SOURCE_TAGS.ESTIMATED);
});

test("rank movement card uses strict previous checkpoint requirements", async () => {
  const noPrevious = buildRankProvenance(baseInput({
    rankDelta: 7,
    previousRank: null,
    topCompetitors: []
  }));
  const withPrevious = buildRankProvenance(baseInput({
    rankDelta: 7,
    previousRank: 25,
    topCompetitors: []
  }));
  const mixed = buildRankProvenance(baseInput({
    rankDelta: 7,
    previousRank: 25,
    topCompetitors: [{ domain: "ahrefs.com", position: 1 }]
  }));

  expect(noPrevious.rankMovementExplanation).toBe(SOURCE_TAGS.ESTIMATED);
  expect(withPrevious.rankMovementExplanation).toBe(SOURCE_TAGS.LIVE);
  expect(mixed.rankMovementExplanation).toBe(SOURCE_TAGS.HYBRID);
});

test("trend story never escalates to live and actionable recipe stays estimated", async () => {
  const twoChecks = buildRankProvenance(baseInput({ trendChecksCount: 2 }));
  const noChecks = buildRankProvenance(baseInput({ trendChecksCount: 0 }));

  expect(twoChecks.trendStory).toBe(SOURCE_TAGS.HYBRID);
  expect(noChecks.trendStory).toBe(SOURCE_TAGS.ESTIMATED);
  expect(twoChecks.actionableRecipe).toBe(SOURCE_TAGS.ESTIMATED);
});

test("copy taxonomy helpers align observed vs modeled language", async () => {
  expect(getObservedFactsIntro(SOURCE_TAGS.LIVE, "keywordOpportunity").toLowerCase()).toContain("observed");
  expect(getObservedFactsIntro(SOURCE_TAGS.HYBRID, "trendStory").toLowerCase()).toContain("observed");
  expect(getModeledRecommendationIntro(SOURCE_TAGS.ESTIMATED, "rankMovementExplanation").toLowerCase()).toContain("modeled");
  expect(getModeledRecommendationIntro(SOURCE_TAGS.HYBRID, "actionableRecipe").toLowerCase()).toContain("modeled");
});

test("scenario estimate labels are standardized", async () => {
  expect(getScenarioEstimateLabel("traffic_gained")).toBe("Scenario estimate");
  expect(getScenarioEstimateLabel("monthly_visits")).toBe("Scenario estimate");
  expect(getScenarioEstimateLabel("ctr_lift")).toBe("Scenario estimate");
  expect(getScenarioEstimateLabel("cumulative_lift")).toBe("Scenario estimate if completed");
});

test("single primary CTA remains in dashboard analysis section", async () => {
  const source = await (await import("node:fs/promises")).readFile(
    new URL("../src/pages/RankPage.jsx", import.meta.url),
    "utf8"
  );
  const sectionMatch = source.match(/data-testid="rank-analysis-section"[\s\S]*?<\/div>\n\s*<\/div>/);
  expect(Boolean(sectionMatch)).toBeTruthy();
  const sectionSource = sectionMatch ? sectionMatch[0] : "";
  const primaryCount = (sectionSource.match(/rp-btn-primary/g) || []).length;
  expect(primaryCount).toBe(1);
});
test("SERP rows with complete fields but estimated snippet markers are not Live", async () => {
  const provenance = buildRankProvenance(baseInput({
    serpPreviewRaw: [
      { position: 1, title: "Result A", domain: "a.com", type: "Organic", description: "Modeled snippet one.", snippetSource: "Estimated snippet" },
      { position: 2, title: "Result B", domain: "b.com", type: "Organic", description: "Modeled snippet two.", snippetSource: "Estimated snippet" }
    ]
  }));

  expect(provenance.serpSnapshot).toBe(SOURCE_TAGS.ESTIMATED);
});
