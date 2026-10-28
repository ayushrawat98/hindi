import rateLimit from "express-rate-limit";

export const burstLimiter = rateLimit({
    windowMs: 5000, // 5 seconds
    max: 1,         // Statistically safe for human jitter
    message: {message : "High frequency requests detected."}
});

// Protects against "Low and Slow" spam bots
export const quotaLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,                  // Above the 99th percentile of human posting
    message: {message : "Hourly limit reached."}
});

export const threadLimiter = rateLimit({
    windowMs: 1000 * 60 * 10, // 5 seconds
    max: 1,         // Statistically safe for human jitter
    message: {message : "Max 1 thread in 10 minutes"}
});

