import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Image } from "@/components/common/Image";
import { BookOpen, ArrowRight } from "lucide-react";
import { IMAGES } from "@/constants/images";

export default function HeroSection() {
  return (
    <Box className="lg:col-span-7 flex flex-col bg-card/50 backdrop-blur-sm border border-border/50 rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:border-border group cursor-pointer relative">
      <Box className="p-8 lg:p-12 flex-1 flex flex-col items-start text-left">
        {/* Fake UI Mockup in left card */}
        <Box className="w-full aspect-4/3 sm:aspect-16/10 bg-background/80 rounded-2xl border border-border/50 p-6 flex flex-col gap-6 shadow-sm mb-12 relative overflow-hidden">
          {/* Header Mockup */}
          <Box className="flex items-center justify-between border-b border-border/50 pb-4">
            <Box className="flex items-center gap-2">
              <Image
                src={IMAGES.REACT_LOGO}
                alt="React"
                className="w-5 h-5 text-primary"
              />
              <Text className="font-semibold text-sm">React Enterprise</Text>
            </Box>
            <Box className="hidden sm:flex items-center gap-4">
              <Box className="w-24 h-6 bg-muted/50 rounded-md" />
              <Box className="w-16 h-6 bg-muted/50 rounded-md" />
            </Box>
          </Box>
          {/* Body Mockup */}
          <Box className="flex gap-6 flex-1">
            {/* Sidebar */}
            <Box className="hidden sm:flex w-1/4 flex-col gap-3">
              <Box className="w-full h-2 bg-muted rounded-full" />
              <Box className="w-5/6 h-2 bg-muted rounded-full" />
              <Box className="w-full h-2 bg-muted rounded-full" />
              <Box className="w-4/6 h-2 bg-muted rounded-full" />
              <Box className="w-full h-2 bg-muted rounded-full" />
              <Box className="w-3/4 h-2 bg-muted rounded-full" />
              <Box className="w-5/6 h-2 bg-muted rounded-full" />
            </Box>
            {/* Content */}
            <Box className="flex-1 flex flex-col gap-4">
              <Box className="w-1/2 h-5 bg-primary/20 rounded-full mb-2" />
              <Box className="w-full h-3 bg-muted rounded-full" />
              <Box className="w-full h-3 bg-muted rounded-full" />
              <Box className="w-5/6 h-3 bg-muted rounded-full" />
              <Box className="w-1/4 h-3 bg-primary/40 rounded-full mt-2" />
            </Box>
          </Box>
          <Box className="absolute inset-0 bg-linear-to-tr from-transparent via-transparent to-primary/5 pointer-events-none" />
        </Box>

        <Box className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-6 shrink-0">
          <BookOpen className="w-6 h-6 text-primary" />
        </Box>
        <Box className="w-full">
          <Heading
            level={2}
            className="text-2xl font-bold mb-4"
          >
            Documentation
          </Heading>
          <Box className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-end w-full">
            <Text className="text-muted-foreground leading-relaxed flex-1">
              React Enterprise Boilerplate has wonderful documentation covering every aspect of the framework. Whether
              you are a newcomer or have prior experience with React, we recommend reading our documentation from
              beginning to end.
            </Text>
            <ArrowRight className="w-5 h-5 text-primary shrink-0 transition-transform group-hover:translate-x-2" />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
