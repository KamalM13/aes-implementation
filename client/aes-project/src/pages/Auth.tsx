import { DisplaySonner } from "../utils/utils";
import { useCookies } from "react-cookie";

import "react-phone-input-2/lib/style.css";
import { GoogleLogin } from "@react-oauth/google";
import { googleSignIn } from "../helper/api/authHelper";

export default function Auth() {
  const [, setCookies] = useCookies([import.meta.env.VITE_ACCESS_COOKIE]);

  const handleGoogleSignIn = async (response: any) => {
    try {
      const googleResponse = await googleSignIn(response.credential);

      DisplaySonner(googleResponse.data.message);

      if (googleResponse.status === 200) {
        setCookies("access_token", googleResponse.data.token, {
          secure: true,
          path: "/",
          sameSite: "strict",
          maxAge: 60 * 60 * 24 * 7, // 7 Days
        });

        window.location.href = "/";
      }
    } catch (error: any) {
      DisplaySonner(error.message);
    }
  };

  const responseMessage = (response: any) => {
    DisplaySonner(response);
  };

  const errorMessage = (response: any) => {
    DisplaySonner(response);
  };

  return (
    <div className="flex justify-center items-center">
      <GoogleLogin
        onSuccess={handleGoogleSignIn}
        onError={() => errorMessage(responseMessage)}
      />
    </div>
  );
}
