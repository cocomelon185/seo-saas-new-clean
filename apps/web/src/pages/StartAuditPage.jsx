import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, Group, List, Paper, Stack, Text, TextInput, ThemeIcon, Title } from "@mantine/core";
import { IconBolt, IconCircleCheckFilled, IconPlayerPlayFilled } from "@tabler/icons-react";
import Seo from "../components/Seo.jsx";
import StartAuditExtras from "../marketing/components/StartAuditExtras.jsx";
import MarketingShell from "../marketing/components/MarketingShell.jsx";
import { getSignupAuditHref } from "../lib/auditGate.js";
import { track } from "../lib/eventsClient.js";

export default function StartAuditPage() {
  const navigate = useNavigate();
  const base = typeof window !== "undefined" ? window.location.origin : "https://rankypulse.com";
  const [auditUrl, setAuditUrl] = useState("https://example.com");

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = String(auditUrl || "").trim();
    if (!url) return;
    track("run_audit_click", { source: "start_page", has_url: true });
    navigate(getSignupAuditHref(url));
  };

  return (
    <MarketingShell>
      <Seo
        title="Start a Free SEO Audit | RankyPulse"
        description="Run a free SEO audit in 30 seconds. Get your score, quick wins, and a clear fix plan."
        canonical={`${base}/start`}
      />

      <Stack gap="xl" maw={860} mx="auto">
        <Card withBorder radius="xl" p={{ base: "lg", md: "xl" }} shadow="md">
          <Stack gap="md">
            <Badge color="violet" variant="light" w="fit-content" size="lg">
              Instant Audit
            </Badge>
            <Title order={1} fz={{ base: 32, md: 44 }} style={{ letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Run your free SEO audit in under a minute
            </Title>
            <Text c="dimmed" fz={{ base: "sm", md: "md" }}>
              Start with one URL. RankyPulse returns prioritized issues, quick wins, and a clear execution path.
            </Text>

            <Paper withBorder radius="lg" p="md">
              <form onSubmit={handleSubmit}>
                <Group align="end" gap="sm" wrap="wrap">
                  <TextInput
                    label="Website URL"
                    value={auditUrl}
                    onChange={(event) => setAuditUrl(event.currentTarget.value)}
                    placeholder="https://example.com"
                    required
                    size="md"
                    radius="md"
                    style={{ flex: 1, minWidth: 230 }}
                  />
                  <Button
                    type="submit"
                    radius="md"
                    size="md"
                    leftSection={<IconPlayerPlayFilled size={16} />}
                    rightSection={<IconBolt size={16} />}
                  >
                    Run Free Audit
                  </Button>
                </Group>
              </form>
            </Paper>

            <List
              spacing="xs"
              icon={
                <ThemeIcon color="violet" variant="light" radius="xl" size={20}>
                  <IconCircleCheckFilled size={14} />
                </ThemeIcon>
              }
            >
              <List.Item>No card required for first run</List.Item>
              <List.Item>Action-focused report with priority order</List.Item>
              <List.Item>Built for founders, agencies, and SaaS growth teams</List.Item>
            </List>

            <Group gap="md">
              <Button component="a" href="/sample-report" variant="light" color="violet">
                View sample report
              </Button>
              <Button component="a" href="/auth/signup?next=%2Faudit" variant="subtle">
                Create free account
              </Button>
            </Group>
          </Stack>
        </Card>

        <Paper withBorder radius="xl" p={{ base: "md", md: "lg" }}>
          <StartAuditExtras />
        </Paper>
      </Stack>
    </MarketingShell>
  );
}
