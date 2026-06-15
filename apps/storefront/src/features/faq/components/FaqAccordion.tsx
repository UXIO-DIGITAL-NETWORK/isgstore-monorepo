import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import FaqItem from "@/features/faq/components/FaqItem";
import { type FaqItem as FaqItemType } from "@/features/faq/types/faq.type";

export default function FaqAccordion(): React.JSX.Element {
  const { t } = useTranslation("faq");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const items = t("items", { returnObjects: true }) as FaqItemType[];

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
