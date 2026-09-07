import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { useFaqsQuery } from "@/hooks/useContentQuery";
import FaqItem from "@/features/faq/components/FaqItem";
import { type FaqItem as FaqItemType } from "@/features/faq/types/faq.type";

export default function FaqAccordion(): React.JSX.Element {
  const { t } = useTranslation("faq");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { data } = useFaqsQuery(locale);

  const apiItems = data?.data ?? [];
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
