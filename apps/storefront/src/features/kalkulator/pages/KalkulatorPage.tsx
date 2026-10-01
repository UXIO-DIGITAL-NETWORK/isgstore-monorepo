import React from "react";
import { Box } from "@/components/common/Box";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import KalkulatorHero from "@/features/kalkulator/components/KalkulatorHero";
import KalkulatorForm from "@/features/kalkulator/components/KalkulatorForm";
import KalkulatorResult from "@/features/kalkulator/components/KalkulatorResult";
import { useKalkulator } from "@/features/kalkulator/hooks/useKalkulator";

export default function KalkulatorPage(): React.JSX.Element {
  const { register, handleSubmit, errors, result } = useKalkulator();

  return (
    <Box className="min-h-dvh bg-[rgb(0,0,0)]">
      <Navbar />

      {/* ── Page content ── */}
      <Box className="max-w-[680px] mx-auto px-4 pb-20">
        {/* Hero: icon + title + subtitle */}
        <KalkulatorHero />

        {/* Calculator card */}
        <Box as="form" onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <KalkulatorForm register={register} errors={errors} />
          <KalkulatorResult result={result} />
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}
