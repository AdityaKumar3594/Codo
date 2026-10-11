import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL, {
    // Don't crash the process on initial connection failure — retry instead
    lazyConnect: false,
    retryStrategy: (times) => Math.min(times * 200, 5000),
});

redis.on("connect", () => {
    console.log("Redis connected");
});

redis.on("error", (err) => {
    // Log but don't let the unhandled error crash the Node process
    console.error("Redis error:", err.message);
});

export default redis;
