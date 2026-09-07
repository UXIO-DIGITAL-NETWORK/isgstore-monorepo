import { Box } from "@/components/common/Box";
import { Container } from "@/components/common/Container";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Link } from "@/components/common/Link";
import { Image } from "@/components/common/Image";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";

export type StatusPageProps = {
  illustrationSrc: string;
  illustrationAlt: string;
  illustrationWidth: number;
  illustrationHeight: number;
  code?: string;
  title: string;
  subtitle: string;
  body: string;
  actionLabel: string;
};

/**
 * Shared full-screen boundary page for the router's notFoundComponent (404) and
 * errorComponent (503) — system_architecture.md §4.12. Renders outside
 * DashboardLayout (no sidebar/topbar) and isn't auth-gated; the "back to home"
 * link is auth-aware.
 */
export function StatusPage({
  illustrationSrc,
  illustrationAlt,
  illustrationWidth,
  illustrationHeight,
  code,
  title,
  subtitle,
  body,
  actionLabel,
}: StatusPageProps) {
  const token = useAuthStore((state) => state.token);
  const homeHref = token ? "/app/dashboard" : "/";

  return (
    <Box
      as="section"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center"
    >
      <Container
        maxWidth="md"
        centerContent
        className="gap-6"
      >
        <Image
          src={illustrationSrc}
          alt={illustrationAlt}
          width={illustrationWidth}
          height={illustrationHeight}
          objectFit="contain"
          priority="eager"
        />

        {code && (
          <Text
            as="span"
            variant="muted"
            className="text-sm font-semibold tabular-nums tracking-widest"
          >
            {code}
          </Text>
        )}

        <Heading
          level={1}
          variant="title"
        >
          {title}
        </Heading>

        <Text
          as="p"
          variant="large"
          className="text-foreground"
        >
          {subtitle}
        </Text>

        <Text
          as="p"
          variant="muted"
        >
          {body}
        </Text>

        <Button asChild>
          <Link href={homeHref}>{actionLabel}</Link>
        </Button>
      </Container>
    </Box>
  );
}
