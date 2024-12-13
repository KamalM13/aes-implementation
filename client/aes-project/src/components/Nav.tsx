import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "../main";

export default function Nav() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <button onClick={() => toggleTheme()} className="mx-2">
        {theme === "light" ? (
          <SunIcon className="w-5" />
        ) : (
          <MoonIcon className="w-5" />
        )}
      </button>
    </>
  );
}
