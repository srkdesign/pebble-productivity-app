import { ReactNode } from "react";
import { useState } from "react";
import { useTheme } from "@heroui/use-theme";
import { Button } from "@heroui/button";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
} from "@heroui/react";

import SunIcon from "@/icons/Sun";
import MoonIcon from "@/icons/Moon";

const Header = ({ children }: { children: ReactNode }) => {
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Navbar maxWidth="full" onMenuOpenChange={setIsMenuOpen}>
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />
        <NavbarBrand>
          <p className="font-bold text-inherit">Pebble Productivity</p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {children}
      </NavbarContent>
      <NavbarMenu className="py-8 gap-4">{children}</NavbarMenu>
      <NavbarContent justify="end">
        <Button
          isIconOnly
          variant="flat"
          onPress={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? (
            <MoonIcon color="currentColor" />
          ) : (
            <SunIcon color="currentColor" />
          )}
        </Button>
      </NavbarContent>
    </Navbar>
  );
};

export default Header;
