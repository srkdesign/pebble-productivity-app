import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button, Drawer } from "@heroui/react";
import {
  AnalyticsIcon,
  CalendarTabIcon,
  MenuIcon,
  MoonIcon,
  Plus,
  SoundOff,
  SoundOn,
  SunIcon,
  TasksIcon,
} from "@icons";
import { useTheme } from "next-themes";

import { useSoundStore } from "@/stores/soundStore";
import { useUiStore } from "@/stores/uiStore";

const menuLinks = [
  {
    title: "Tasks",
    url: "/",
    icon: <TasksIcon color="currentColor" size={16} />,
  },
  {
    title: "Calendar",
    url: "calendar/",
    icon: <CalendarTabIcon color="currentColor" size={16} />,
  },
  {
    title: "Analytics",
    url: "analytics/",
    icon: <AnalyticsIcon color="currentColor" size={16} />,
  },
];

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { muted, toggleMute } = useSoundStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const createTaskRef = useUiStore((s) => s.targetRef);

  const navigate = useNavigate();

  const handleClick = async () => {
    if (location.pathname !== "/") {
      await navigate("/");
    }

    createTaskRef?.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="bg-zinc-100 dark:bg-zinc-950 p-3 md:pt-4 md:pr-9 md:pl-6 flex items-center justify-between relative">
      <div className="block md:hidden">
        <Button
          style={
            {
              "--color-default": theme === "dark" ? "#18181b" : "#ffffff",
            } as React.CSSProperties
          }
          variant="tertiary"
          onPress={() => setIsMenuOpen(true)}
        >
          <MenuIcon color="currentColor" />
          Menu
        </Button>
      </div>

      <div className="hidden md:block">
        <Link to="/">
          <div className="flex gap-2.5 items-baseline">
            {" "}
            <img
              alt="Logo"
              className="dark:hidden max-w-28"
              src="/logo/light.png"
            />
            <img
              alt="Logo"
              className="hidden dark:block max-w-28"
              src="/logo/dark.png"
            />
          </div>

          {/* <div className="block md:hidden">PB</div> */}
        </Link>
      </div>

      <nav className="absolute left-1/2 top-1/2 -translate-1/2 hidden md:block">
        <ul className=" flex  justify-center *:rounded-xl py-1.5 px-1.5 rounded-full leading-none">
          {menuLinks.map((item, idx) => (
            <li
              key={idx}
              className="*:aria-[current='page']:bg-zinc-50 dark:*:aria-[current='page']:bg-zinc-900 text-sm"
            >
              <NavLink
                className="flex gap-1.5 items-center w-full h-full decoration-0 px-4 py-2 rounded-full font-medium"
                to={item.url}
              >
                {item.icon}
                {item.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex gap-2">
        <Button
          isIconOnly
          className="size-10 md:size-9 [&_svg]:size-6"
          style={
            {
              "--color-default": theme === "dark" ? "#18181b" : "#ffffff",
            } as React.CSSProperties
          }
          variant="tertiary"
          onPress={() => handleClick()}
        >
          <Plus color="currentColor" />
        </Button>
        <Button
          isIconOnly
          className="size-10 md:size-9 [&_svg]:size-5"
          style={
            {
              "--color-default": theme === "dark" ? "#18181b" : "#ffffff",
            } as React.CSSProperties
          }
          variant="tertiary"
          onPress={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? (
            <MoonIcon color="currentColor" />
          ) : (
            <SunIcon color="currentColor" />
          )}
        </Button>
        <Button
          isIconOnly
          className="size-10 md:size-9 [&_svg]:size-5"
          style={
            {
              "--color-default": theme === "dark" ? "#18181b" : "#ffffff",
            } as React.CSSProperties
          }
          variant="tertiary"
          onPress={toggleMute}
        >
          {muted ? (
            <SoundOff color="currentColor" />
          ) : (
            <SoundOn color="currentColor" />
          )}
        </Button>
      </div>

      <Drawer isOpen={isMenuOpen}>
        <Drawer.Backdrop
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMenuOpen(false);
          }}
        >
          <Drawer.Content className="*:p-3" placement="top">
            <Drawer.Dialog>
              <Drawer.Header className="*:flex">
                <Button variant="tertiary" onPress={() => setIsMenuOpen(false)}>
                  Close
                </Button>
              </Drawer.Header>
              <Drawer.Body>
                <ul className="flex flex-col *:w-full gap-2 *:p-3 *:bg-zinc-100/80 dark:*:bg-zinc-800/50 *:rounded-xl">
                  {menuLinks.map((item, idx) => (
                    <li key={idx}>
                      <Link
                        className="flex gap-2 items-center w-full h-full decoration-0 text-zinc-950 dark:text-zinc-50"
                        to={item.url}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.icon}
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </header>
  );
}
