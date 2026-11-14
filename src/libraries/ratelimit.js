import rateLimit from "express-rate-limit";

const second = 1000
const minute = second * 60

//burst protector
export const burstLimiter = rateLimit({
    windowMs: 8 * second, // 5 seconds
    max: 1,         // Statistically safe for human jitter
    message: {message : "अत्यधिक अनुरोध। प्रतीक्षा करें।"}
});

// Protects against "Low and Slow" spam bots
export const quotaLimiter = rateLimit({
    windowMs: 60 * minute, // 1 hour
    max: 30,                  // Above the 99th percentile of human posting
    message: {message : "प्रति घंटे की सीमा समाप्त हो गई है।"}
});


export const threadLimiter = rateLimit({
    windowMs: 5 * minute, // 5 minutes
    max: 1,         // Statistically safe for human jitter
    message: {message : "५ मिनट में अधिकतम १ थ्रेड की अनुमति है।"}
});

