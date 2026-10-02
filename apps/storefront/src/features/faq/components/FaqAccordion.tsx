import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { Skeleton } from "@/components/common/Skeleton";
import { useFaqsQuery } from "@/hooks/useContentQuery";
import FaqItem from "@/features/faq/components/FaqItem";
import { type FaqItem as FaqItemType } from "@/features/faq/types/faq.type";

function FaqSkeleton(): React.JSX.Element {
  return (
    <Box aria-busy="true" className="flex flex-col gap-3.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-2xl" />
      ))}
    </Box>
  );
}

export default function FaqAccordion(): React.JSX.Element {
  const { t } = useTranslation("faq");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqsQuery = useFaqsQuery(locale);

  // A first load is worth a skeleton; a failure is not worth an error screen,
  // because the bundled copy below is a complete answer on its own.
  if (faqsQuery.isPending && faqsQuery.fetchStatus !== "idle") {
    return <FaqSkeleton />;
  }

  const apiItems = faqsQuery.data?.data ?? [];
  // The bundled copy stands in until the request lands, and stays if it fails
  // or returns nothing — a help page that renders empty is worse than a stale
  // one.
  const items: FaqItemType[] = apiItems.length
    ? apiItems.map((faq) => ({ question: faq.question, answer: faq.answer }))
    : (t("items", { returnObjects: true }) as FaqItemType[]);

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <Box className="flex flex-col gap-3.5">
      {items.map((item, index) => (
        <FaqItem
          key={index}
          index={index}
          question={item.question}
          answer={item.answer}
          isOpen={openIndex === index}
          onToggle={() => handleToggle(index)}
        />
      ))}
    </Box>
  );
}
