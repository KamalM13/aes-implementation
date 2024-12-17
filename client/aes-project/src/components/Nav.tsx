import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "../main";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Nav() {
  const { theme, toggleTheme } = useTheme();
  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {auth.isLoggedIn ? (
        <div className="flex justify-end">
          <button onClick={() => navigate("/")} >
            Home
          </button>
          <button onClick={() => navigate("/history")} className="mx-2 border-x-2 px-2">
            History
          </button>
          <button onClick={() => auth.logout()} >
            Log out
          </button>
        </div>
      ) : (
        <div className="flex justify-end ">
          <button onClick={() => navigate("/")} >
            Home
          </button>
          <button
            onClick={() => (window.location.href = "/auth")}
            className="mx-2 border-x-2 px-2"
          >
            Login
          </button>
          <button
            onClick={() => (window.location.href = "/auth/register")}
            
          >
            Register
          </button>
        </div>
      )}

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
