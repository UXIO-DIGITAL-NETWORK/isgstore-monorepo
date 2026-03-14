import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { ArrowRight } from "lucide-react";
import { HOME_FEATURES } from "../data/home-features.data";

export default function FeatureCards() {
  return (
    <Box className="lg:col-span-5 flex flex-col gap-6 lg:gap-8">
      {HOME_FEATURES.map((feature) => {
        const Icon = feature.icon;

        return (
          <Box
            key={feature.id}
            className="flex flex-col sm:flex-row gap-6 p-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-[2rem] shadow-xl transition-all hover:border-border group cursor-pointer relative overflow-hidden text-left"
          >
            <Box className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </Box>
            <Box className="flex-1 relative z-10">
              {feature.hasHoverArrow ? (
                <Box className="flex items-center justify-between mb-2">
                  <Heading
                    level={3}
                    className="text-xl font-bold"
                  >
                    {feature.title}
                  </Heading>
                  <ArrowRight className="w-5 h-5 text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </Box>
              ) : (
                <Heading
                  level={3}
                  className="text-xl font-bold mb-2"
                >
                  {feature.title}
                </Heading>
              )}
              <Text className="text-muted-foreground text-sm leading-relaxed">{feature.description}</Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
