import React from "react";
import { useTheme } from "@heroui/use-theme";
import { Button } from "@heroui/button";
import {
  Navbar,
  Link,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import SunIcon from "@/icons/Sun";
import MoonIcon from "@/icons/Moon";

const Header = ({ children }) => {
  const { theme, setTheme } = useTheme();

  return (
    <Navbar className="" maxWidth="full">
      <NavbarBrand>
        <p className="font-bold text-inherit">Pebble Productivity</p>
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {children}
      </NavbarContent>
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
