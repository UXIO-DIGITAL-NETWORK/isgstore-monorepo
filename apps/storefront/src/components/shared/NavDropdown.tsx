import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useRouterState } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Link } from "@/components/common/Link";
import type { NavLink } from "@/types/navbar";

interface NavDropdownProps {
  link: NavLink & { children: NavLink[] };
}

export function NavDropdown({ link }: NavDropdownProps): React.JSX.Element {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const [left, setLeft] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { location } = useRouterState();

  // Capture trigger position when opening
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTriggerRect(rect);
      setLeft(rect.left);
    }
  }, [open]);

  // Clamp horizontal position so the dropdown stays within the viewport
  useLayoutEffect(() => {
    if (open && triggerRect && dropdownRef.current) {
      const margin = 8;
      const maxLeft = window.innerWidth - dropdownRef.current.offsetWidth - margin;
      setLeft(Math.max(margin, Math.min(triggerRect.left, maxLeft)));
    }
  }, [open, triggerRect]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);
      if (!clickedTrigger && !clickedDropdown) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Active when the current path matches any child route
  const isActive = link.children.some((child) => {
    const pathname = location.pathname;
    return pathname === child.href || pathname.startsWith(child.href + "/");
  });

  return (
    <Box className="relative">
      {/* Trigger */}
      <Box
        ref={triggerRef}
        as="button"
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 text-xs md:text-[13px] whitespace-nowrap tracking-wide font-medium transition-colors font-outfit cursor-pointer outline-none select-none ${
          isActive ? "text-[rgb(208,201,129)]" : "text-white/45 hover:text-white/80"
        }`}
      >
        {t(link.labelKey)}
        <ChevronDown
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </Box>

      {/* Dropdown rendered via portal to escape overflow-x-auto clipping */}
      {open && triggerRect &&
        createPortal(
          <Box
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: triggerRect.bottom + 8,
              left,
            }}
            className="bg-[rgb(26,34,16)] border border-white/10 rounded-xl overflow-hidden min-w-48 z-[9999] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
          >
            {link.children.map((child) => {
              const childActive =
                location.pathname === child.href ||
                location.pathname.startsWith(child.href + "/");
              return (
                <Link
                  key={child.labelKey}
                  href={child.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center w-full px-4 py-2.5 text-[13px] font-outfit font-medium transition-colors hover:bg-white/6 ${
                    childActive
                      ? "text-[rgb(208,201,129)]"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <Text as="span" className="font-outfit text-[13px]">
                    {t(child.labelKey)}
                  </Text>
                </Link>
              );
            })}
          </Box>,
          document.body
        )}
    </Box>
  );
}
