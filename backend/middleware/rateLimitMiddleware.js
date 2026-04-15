import { rateLimit } from "express-rate-limit";

/**
 * Global rate limiter: Applies to all API requests.
 * Prevents general server abuse.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
});

/**
 * Auth rate limiter: Specific for login/register routes.
 * Prevents brute-force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Limit each IP to 10 requests per window (login attempts)
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many login/registration attempts. Please try again after 15 minutes.",
  },
});
