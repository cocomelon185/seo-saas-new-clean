import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Center,
  Container,
  Grid,
  Group,
  List,
  Paper,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title
} from "@mantine/core";
import { LineChart } from "@mantine/charts";
import {
  IconArrowRight,
  IconBolt,
  IconChecklist,
  IconCircleCheckFilled,
  IconLockCheck,
  IconSparkles
} from "@tabler/icons-react";
import Seo from "../components/Seo.jsx";
import MarketingShell from "../marketing/components/MarketingShell.jsx";
import { getSignupAuditHref } from "../lib/auditGate.js";
import { track } from "../lib/eventsClient.js";

const kpiCards = [
  { label: "Active projects", value: "12,600+" },
  { label: "Avg. audit run time", value: "43s" },
  { label: "Fixes shipped monthly", value: "141k+" },
  { label: "Median score lift", value: "+27%" }
];

const chartData = [
  { week: "W1", score: 62, issues: 38 },
  { week: "W2", score: 68, issues: 30 },
  { week: "W3", score: 73, issues: 24 },
  { week: "W4", score: 78, issues: 18 },
  { week: "W5", score: 84, issues: 12 }
];

const featureCards = [
  {
    title: "Issue triage board",
    text: "Focus teams on impact-first fixes, not a noisy list.",
    icon: IconChecklist
  },
  {
    title: "AI fix guidance",
    text: "Beginner and expert tracks with copy-ready instructions.",
    icon: IconSparkles
  },
  {
    title: "Conversion-safe rollout",
    text: "Guardrails keep SEO improvements aligned with signup goals.",
    icon: IconLockCheck
  }
];

const comparisonRows = [
  ["Audit-to-action workflow", "Purpose-built", "Broad toolkit", "Broad toolkit"],
  ["Fix explanation quality", "Beginner + expert", "Technical-heavy", "Technical-heavy"],
  ["Launch readiness dashboard", "Included", "Partial", "Partial"]
];

export default function Landing() {
  const navigate = useNavigate();
  const [auditUrl, setAuditUrl] = useState("https://www.example.com");
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";

  const signupAuditHref = useMemo(() => getSignupAuditHref(auditUrl), [auditUrl]);

  const submitRunAudit = (e) => {
    e.preventDefault();
    const candidate = String(auditUrl || "").trim();
    if (!candidate) return;
    track("run_audit_click", { source: "landing_hero", has_url: true });
    navigate(getSignupAuditHref(candidate));
  };

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "RankyPulse",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: `${base}/`,
      description:
        "RankyPulse helps you make clear SEO decisions with fast audits, page reports, and actionable recommendations.",
      brand: { "@type": "Brand", name: "RankyPulse" }
    }
  ];

  return (
    <MarketingShell>
      <Seo
        title="RankyPulse - Clear SEO decisions"
        description="Turn SEO issues into shipped fixes with fast audits, clear priorities, and team-ready execution."
        canonical={`${base}/`}
        jsonLd={structuredData}
      />

      <Container size="xl" px={0}>
        <Grid gutter="xl" align="stretch">
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <Stack gap="lg">
              <Badge variant="light" color="violet" size="lg" radius="xl" w="fit-content">
                Built for modern SEO teams
              </Badge>
              <Title order={1} fz={{ base: 36, md: 52 }} style={{ lineHeight: 1.08, letterSpacing: "-0.03em" }}>
                Premium SEO clarity, from first audit to shipped fix.
              </Title>
              <Text c="dimmed" fz={{ base: "md", md: "lg" }} maw={680}>
                Inspired by the best SaaS experiences: fast entry, clean analytics surfaces, and action-first workflows.
                Run one audit and know exactly what to fix next.
              </Text>
              <Paper withBorder radius="xl" p="md" shadow="sm">
                <form onSubmit={submitRunAudit}>
                  <Group align="end" gap="sm" wrap="wrap">
                    <TextInput
                      label="Website URL"
                      value={auditUrl}
                      onChange={(event) => setAuditUrl(event.currentTarget.value)}
                      placeholder="https://example.com"
                      size="md"
                      radius="md"
                      style={{ flex: 1, minWidth: 240 }}
                    />
                    <Button type="submit" size="md" radius="md" rightSection={<IconArrowRight size={16} />}>
                      Run Free Audit
                    </Button>
                  </Group>
                </form>
                <Group mt="sm" gap="xs">
                  <Button component={Link} to="/sample-report" variant="subtle" size="compact-sm" radius="md">
                    View sample report
                  </Button>
                  <Text size="xs" c="dimmed">
                    Free account required
                  </Text>
                </Group>
              </Paper>
              <List
                spacing="xs"
                center
                icon={
                  <ThemeIcon color="violet" variant="light" size={20} radius="xl">
                    <IconCircleCheckFilled size={14} />
                  </ThemeIcon>
                }
              >
                <List.Item>Prioritized fixes, not a wall of errors</List.Item>
                <List.Item>Charts and trendlines your team can trust</List.Item>
                <List.Item>Share-ready reports with strong visual hierarchy</List.Item>
              </List>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Card withBorder radius="xl" shadow="md" p="lg" h="100%">
              <Group justify="space-between" mb="md">
                <Text fw={700}>SEO Health Overview</Text>
                <Badge color="teal" variant="light">
                  Live
                </Badge>
              </Group>
              <Center mb="md">
                <RingProgress
                  size={170}
                  thickness={18}
                  roundCaps
                  sections={[
                    { value: 84, color: "violet.7" },
                    { value: 10, color: "teal.5" }
                  ]}
                  label={
                    <Stack gap={0} align="center">
                      <Text fw={800} fz={28}>
                        84
                      </Text>
                      <Text size="xs" c="dimmed">
                        SEO score
                      </Text>
                    </Stack>
                  }
                />
              </Center>
              <LineChart
                h={180}
                data={chartData}
                dataKey="week"
                series={[
                  { name: "score", color: "violet.7" },
                  { name: "issues", color: "teal.6" }
                ]}
                curveType="monotone"
                withLegend
                withTooltip
              />
              <Group justify="space-between" mt="md">
                <Button component={Link} to={signupAuditHref} variant="light" color="violet" radius="md">
                  Open audit flow
                </Button>
                <Text size="xs" c="dimmed">
                  Preview modeled after top SEO SaaS UX
                </Text>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mt="xl" spacing="md">
          {kpiCards.map((item) => (
            <Card key={item.label} withBorder radius="lg" p="lg">
              <Text size="xs" tt="uppercase" c="dimmed" fw={700}>
                {item.label}
              </Text>
              <Text fz={30} fw={800} mt={6}>
                {item.value}
              </Text>
            </Card>
          ))}
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 3 }} mt="xl" spacing="md">
          {featureCards.map((item) => (
            <Card key={item.title} withBorder radius="lg" p="lg">
              <ThemeIcon size={42} radius="md" variant="light" color="violet">
                <item.icon size={22} />
              </ThemeIcon>
              <Text mt="md" fw={700} fz="lg">
                {item.title}
              </Text>
              <Text mt="xs" c="dimmed" size="sm">
                {item.text}
              </Text>
            </Card>
          ))}
        </SimpleGrid>

        <Paper withBorder radius="xl" p="xl" mt="xl">
          <Group justify="space-between" align="end" mb="md">
            <Stack gap={4}>
              <Badge variant="light" color="violet" w="fit-content">
                Positioning
              </Badge>
              <Title order={2}>Built to feel as premium as Ahrefs and Semrush</Title>
            </Stack>
            <Button component={Link} to="/compare/rankypulse-vs-ahrefs" variant="light" color="violet">
              Open comparisons
            </Button>
          </Group>
          <Stack gap="xs">
            <Group fw={700} c="dimmed">
              <Text style={{ flex: 1 }}>Category</Text>
              <Text style={{ flex: 1 }}>RankyPulse</Text>
              <Text style={{ flex: 1 }}>Ahrefs</Text>
              <Text style={{ flex: 1 }}>Semrush</Text>
            </Group>
            {comparisonRows.map((row) => (
              <Group key={row[0]} align="start">
                {row.map((cell, idx) => (
                  <Text key={`${row[0]}-${idx}`} style={{ flex: 1 }} size="sm" c={idx === 1 ? "dark" : "dimmed"}>
                    {cell}
                  </Text>
                ))}
              </Group>
            ))}
          </Stack>
        </Paper>

        <Paper
          mt="xl"
          radius="xl"
          p="xl"
          style={{
            background: "linear-gradient(130deg, #6d28d9 0%, #4f1d97 55%, #1c2f5f 100%)",
            color: "white"
          }}
        >
          <Group justify="space-between" align="center" gap="lg">
            <Stack gap={4}>
              <Badge color="white" c="violet.9" variant="filled" w="fit-content">
                Launch Mode
              </Badge>
              <Title order={3} c="white">
                Ready to ship your first high-impact SEO sprint?
              </Title>
              <Text c="violet.0">
                Start with one URL, get a clear action queue, and move to execution without dashboard friction.
              </Text>
            </Stack>
            <Group>
              <Button component={Link} to={signupAuditHref} color="white" c="violet.9" radius="md" leftSection={<IconBolt size={16} />}>
                Run audit now
              </Button>
              <Button component={Link} to="/pricing" variant="outline" color="white" radius="md">
                View pricing
              </Button>
            </Group>
          </Group>
        </Paper>
      </Container>
    </MarketingShell>
  );
}
