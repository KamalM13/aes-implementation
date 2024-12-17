import User from "../../models/Users.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Google token is required." });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub,picture } = payload;

    const firstName = name.split(" ")[0];
    const lastName = name.split(" ")[1];

    let user = await User.findOne({ $or: [{ email }, { googleId: sub }] });

    if (!user) {
      user = new User({
        email,
        firstName,
        lastName,
        googleId: sub,
        profileImage:picture,
        isActivated: true,
      });
      await user.save();
    }


    // Generate JWT
    const JWTtoken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.SECRET
    );

    res.cookie("access_token", JWTtoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return res.json({ token:JWTtoken, UserID: user._id });
  } catch (error) {
    console.error("Google Login Error:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error. Please try again later." });
  }
};
export const logout = async (req, res) => {
  try {
    res.clearCookie("access_token");
    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during logout:", error);
    return res
      .status(201)
      .json({ message: "Internal Server Error. Please Try again later." });
  }
};
