import React, { useEffect, createContext, useContext, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import { useCookies } from "react-cookie";
import "./index.css";
import { Toaster } from "sonner";
import Nav from "./components/Nav.tsx";

const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});

const Root = () => {
  axios.defaults.withCredentials = true;
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
  const [themeCookie, setThemeCookie] = useCookies(["theme"]);
  const [theme, setTheme] = useState(themeCookie.theme || "light");

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    setThemeCookie("theme", newTheme, {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      path: "/",
    });
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <React.StrictMode>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <BrowserRouter>
          <Nav />
          <App />
          <Toaster />
        </BrowserRouter>
      </ThemeContext.Provider>
    </React.StrictMode>
  );
};

export const useTheme = () => useContext(ThemeContext);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <div className="dark:bg-neutral-900 bg-white text-black dark:text-white">
    <Root />
  </div>
);
