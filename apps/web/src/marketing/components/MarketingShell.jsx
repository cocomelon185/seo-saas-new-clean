import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ActionIcon,
  Anchor,
  Box,
  Burger,
  Button,
  Container,
  Divider,
  Drawer,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  Title
} from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import logo from "../../assets/rankypulse-logo.svg";
import CookieConsent from "../../components/CookieConsent.jsx";
import { clearAuthSession, getAuthDisplayName, getAuthToken, getAuthUser } from "../../lib/authClient.js";
import MantineRoot from "../../theme/MantineRoot.jsx";

const navLinks = [
  { href: "/start", label: "Start" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/about", label: "About" },
  { href: "/changelog", label: "Changelog" },
  { href: "/shared", label: "Sample report" }
];

export default function MarketingShell({ title, subtitle, children }) {
  const [authUser, setAuthUser] = useState(null);
  const [authed, setAuthed] = useState(false);
  const [menuOpened, setMenuOpened] = useState(false);

  useEffect(() => {
    const sync = () => {
      setAuthUser(getAuthUser());
      setAuthed(Boolean(getAuthToken()));
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return (
    <MantineRoot>
      <Box
        component="div"
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(900px circle at 0% -10%, rgba(159,95,255,0.22), transparent 42%), radial-gradient(750px circle at 100% 0%, rgba(52,210,235,0.12), transparent 48%), #f6f3ff"
        }}
      >
        <Anchor href="#main" className="rp-skip">
          Skip to content
        </Anchor>

        <Paper
          radius={0}
          shadow="xs"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            borderBottom: "1px solid rgba(124, 58, 237, 0.16)",
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(8px)"
          }}
        >
          <Container size={1360} px={{ base: "md", lg: "xl" }} py="md">
            <Group justify="space-between" align="center">
              <Group gap="sm" align="center">
                <ActionIcon
                  component={Link}
                  to="/"
                  variant="light"
                  color="violet"
                  radius="xl"
                  size={40}
                  aria-label="RankyPulse home"
                >
                  <Image src={logo} alt="RankyPulse" w={22} h={22} />
                </ActionIcon>
                <Text fw={800} fz="lg" c="dark.9">
                  RankyPulse
                </Text>
              </Group>

              <Group gap={20} visibleFrom="md">
                {navLinks.map((item) => (
                  <Anchor key={item.href} component={Link} to={item.href} c="dark.5" fw={600} fz="sm">
                    {item.label}
                  </Anchor>
                ))}
              </Group>

              <Group gap="xs">
                <Burger
                  opened={menuOpened}
                  onClick={() => setMenuOpened((v) => !v)}
                  hiddenFrom="md"
                  size="sm"
                  aria-label="Toggle navigation menu"
                />
                {authed ? (
                  <>
                    <Button component={Link} to="/account/settings" variant="default" radius="xl" size="xs">
                      {getAuthDisplayName(authUser) || "My account"}
                    </Button>
                    <Button
                      variant="light"
                      color="slate"
                      radius="xl"
                      size="xs"
                      onClick={() => {
                        clearAuthSession();
                        setAuthed(false);
                        window.location.assign("/");
                      }}
                    >
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button component={Link} to="/auth/signin" variant="default" radius="xl" size="xs">
                      Sign in
                    </Button>
                    <Button component={Link} to="/start" rightSection={<IconArrowRight size={14} />} radius="xl" size="xs">
                      Run Free Audit
                    </Button>
                  </>
                )}
              </Group>
            </Group>
          </Container>
        </Paper>

        <Drawer
          opened={menuOpened}
          onClose={() => setMenuOpened(false)}
          title="Navigate"
          hiddenFrom="md"
          position="right"
          size="xs"
        >
          <Stack gap="sm">
            {navLinks.map((item) => (
              <Button
                key={item.href}
                component={Link}
                to={item.href}
                variant="subtle"
                justify="flex-start"
                onClick={() => setMenuOpened(false)}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        </Drawer>

        <Container id="main" size={1360} px={{ base: "md", lg: "xl" }} py="xl">
          {(title || subtitle) && (
            <Paper withBorder radius="xl" p={{ base: "lg", md: "xl" }} mb="xl" shadow="sm">
              {title ? (
                <Title order={1} fz={{ base: 30, md: 40 }} style={{ letterSpacing: "-0.02em" }}>
                  {title}
                </Title>
              ) : null}
              {subtitle ? (
                <Text mt="md" c="dimmed" maw={860} fz={{ base: "sm", md: "md" }}>
                  {subtitle}
                </Text>
              ) : null}
            </Paper>
          )}
          {children}
        </Container>

        <Container size={1360} px={{ base: "md", lg: "xl" }} pb="xl">
          <Paper withBorder radius="xl" p="lg" shadow="xs">
            <Group justify="space-between" align="center" gap="md">
              <Text c="dimmed" size="sm">
                (c) 2026 RankyPulse
              </Text>
              <Group gap="lg">
                <Anchor component={Link} to="/privacy" size="sm" c="dark.5">
                  Privacy
                </Anchor>
                <Anchor component={Link} to="/terms" size="sm" c="dark.5">
                  Terms
                </Anchor>
                <Anchor component={Link} to="/contact" size="sm" c="dark.5">
                  Contact
                </Anchor>
              </Group>
            </Group>
          </Paper>
          <Divider my="md" color="violet.1" />
        </Container>
        <CookieConsent />
      </Box>
    </MantineRoot>
  );
}
