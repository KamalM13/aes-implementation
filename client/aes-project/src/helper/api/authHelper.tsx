import api from "../../utils/apiClient";
import { AxiosResponse } from "axios";
import { DisplaySonner } from "../../utils/utils";

interface GoogleSignInResponse {
  message: string;
  token: string;
  UserID: string;
}

export const googleSignIn = async (
  token: string
): Promise<AxiosResponse<GoogleSignInResponse>> => {
  try {
    return await api.post<GoogleSignInResponse>("/googleLogin", { token });
  } catch (error: any) {
    DisplaySonner(error.response?.data?.message || "Google sign-in failed");
    return Promise.reject(error);
  }
};
