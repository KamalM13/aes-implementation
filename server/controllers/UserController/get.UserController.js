import User from "../../models/Users.js";
import { sendPasswordResetEmail } from "../Emails/Emails.js";

export const getUser = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(201).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(201).json({ message: "User not found" });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000);

    user.resetPasswordToken = resetCode;
    await user.save();

    await sendPasswordResetEmail(email, resetCode);

    return res
      .status(200)
      .json({ message: "Check your email for verification code." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const checkToken = async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email) {
      return res.status(201).json({ message: "Email is required" });
    }

    if (!token) {
      return res.status(201).json({ message: "Code is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(201).json({ message: "User not found" });
    }

    if (user.resetPasswordToken != token) {
      return res.status(201).json({ message: "Code is incorrect" });
    }

    user.resetPasswordToken = Math.floor(100000 + Math.random() * 900000);

    await user.save();

    return res.status(200).json({
      message: "Code Verified, You're able now to change your password safely.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyUser = async (req, res, next) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered OR Token malfunctioned");
    }
    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).send("Permissions didn't match");
    }
    return res.status(200).json({
      message: "OK",
      user: user,
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({ message: "ERROR", cause: error.message });
  }
};
