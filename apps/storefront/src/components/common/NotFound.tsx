import { Button } from "@heroui/react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Ghost } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Box } from "@/components/common/Box";
import { Container } from "@/components/common/Container";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";

/**
 * The 404 page.
 *
 * Its copy used to be hardcoded English on a storefront whose default language
 * is Indonesian — and written as a gaming in-joke ("went AFK", "destroyed by the
 * enemy") that told a lost customer nothing about what had happened or what to
 * do next. It now says which of the ordinary causes applies and offers the way
 * out, in whichever language the page is being read in.
 */
export const NotFound = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("common");
  // "Home" is locale-scoped here — `/` only redirects to the default language,
  // so sending someone reading English back to `/` would silently switch them
  // to Indonesian on the way out of an error page.
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };

  return (
    <Box className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <Container className="flex w-full flex-col items-center justify-center text-center">
        <Box className="mb-8 flex h-32 w-32 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 shadow-2xl">
          <Ghost className="h-16 w-16 animate-pulse text-neutral-500" />
        </Box>

        <Heading className="mb-4 text-6xl font-extrabold tracking-tight text-white md:text-8xl">404</Heading>

        <Heading className="mb-6 text-2xl font-bold tracking-tight text-neutral-300 md:text-3xl">
          {t("notFound.title")}
        </Heading>

        <Text className="mb-10 max-w-lg text-lg text-neutral-500">{t("notFound.description")}</Text>

        <Button
          onPress={() => navigate({ to: "/$locale", params: { locale } })}
          className="h-14 rounded-full bg-sky-500 px-10 text-lg font-bold text-white shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all hover:bg-sky-600 hover:shadow-[0_0_30px_rgba(14,165,233,0.6)]"
        >
          {t("notFound.backHome")}
        </Button>
      </Container>
    </Box>
  );
};
