import jwt from "jsonwebtoken";
import User from "../models/Users.js";

export const authenticateToken = async (req, res, next) => {
  // Extract token from various sources
  let token =
    req.headers.authorization ||
    req.cookies.access_token ||
    req.params.authToken ||
    req.headers['authorization'];

  // Parse the token from the cookie header, if available
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split('; ').reduce((acc, cookie) => {
      const [key, value] = cookie.split('=');
      acc[key] = value;
      return acc;
    }, {});
    token = cookies.access_token || token; 
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: `Unauthorized: No token provided.` });
  }

  try {
    const tokenString = token.startsWith("Bearer ") ? token.slice(7) : token;
    const decoded = jwt.verify(tokenString, process.env.SECRET);

    req.userId = decoded.id;
    req.role = decoded.role;
    req.plan = decoded.plan;
    res.locals.jwtData = decoded;

    const user = await User.findById(req.userId);

    const susRes = await SuspendedChecker(user, res);
    if (susRes) {
      return susRes;
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Forbidden: Invalid token" });
  }
};

const SuspendedChecker = async (user, res) => {
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.suspended && user.suspended.status) {
    if (user.suspended.suspendedTill < Date.now()) {
      user.suspended.status = false;
      user.suspended.reason = "";
      user.suspended.suspendedTill = "";
      await user.save();
    } else {
      return res.status(403).json({ message: "Forbidden: User is suspended" });
    }
  }
};

export const plusOnly = (req, res, next) => {
  if (req.plan !== "plus") {
    return res.status(403).json({ message: "Forbidden: Plus plan only" });
  }
  next();
};

export const payAsUGoOnly = (req, res, next) => {
  if (req.plan !== "payasugo") {
    return res.status(403).json({ message: "Forbidden: Pay as you go plan only" });
  }
  next();
}

// Role-based access control middleware
export const adminOnly = (req, res, next) => {
  if (req.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next();
};

export const secretaryOnly = (req, res, next) => {
  if (req.role !== "secretary" && req.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Secretary only" });
  }
  next();
};

export const moderatorOnly = (req, res, next) => {
  if (req.role !== "moderator" && req.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Moderator only" });
  }
  next();
};
