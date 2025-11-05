import jwt from "jsonwebtoken";
import { sendResponse } from "../utils/responseHandler.js";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return sendResponse(res, 401, false, "No token provided");

  const token = authHeader.split(" ")[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return sendResponse(res, 403, false, "Invalid or expired token");
  }
};