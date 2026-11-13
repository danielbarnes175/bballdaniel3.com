const crypto = require("crypto");

function randomToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString("base64url");
}

function parseCookies(req) {
    const cookies = Object.create(null);
    for (const item of String(req.headers.cookie || "").split(";")) {
        const separator = item.indexOf("=");
        if (separator === -1) continue;
        const key = item.slice(0, separator).trim();
        const value = item.slice(separator + 1).trim();
        if (key) cookies[key] = value;
    }
    return cookies;
}

function storyCookieName(code) {
    return `story_${String(code).toUpperCase()}`;
}

function getStoryToken(req, code) {
    return parseCookies(req)[storyCookieName(code)] || "";
}

function setStoryToken(res, code, token, secure = false) {
    const attributes = [
        `${storyCookieName(code)}=${token}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Strict",
        "Max-Age=86400"
    ];
    if (secure) attributes.push("Secure");
    res.append("Set-Cookie", attributes.join("; "));
}

function safeEqual(left, right) {
    if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
    return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

function normalizeName(value) {
    const name = String(value || "").trim();
    if (!name || name.length > 40 || /[\u0000-\u001f\u007f]/.test(name)) return null;
    return name;
}

function publicOrigin(req) {
    const configured = process.env.PUBLIC_ORIGIN;
    if (configured) return configured.replace(/\/$/, "");
    return `${req.protocol}://${req.get("host")}`;
}

function normalizeOrigin(value) {
    try {
        return new URL(value).origin;
    } catch {
        return null;
    }
}

function sameOriginOnly(req, res, next) {
    const fetchSite = req.get("sec-fetch-site");
    if (fetchSite === "cross-site") return res.status(403).send("Cross-site request rejected");
    if (fetchSite === "same-origin" || fetchSite === "none") return next();

    const origin = req.get("origin");
    if (!origin) return next();

    const allowedOrigins = new Set([normalizeOrigin(publicOrigin(req))]);
    const forwardedHost = req.get("x-forwarded-host");
    const forwardedProto = req.get("x-forwarded-proto");
    if (forwardedHost && forwardedProto) {
        allowedOrigins.add(normalizeOrigin(`${forwardedProto.split(",")[0].trim()}://${forwardedHost.split(",")[0].trim()}`));
    }
    allowedOrigins.delete(null);

    if (!allowedOrigins.has(normalizeOrigin(origin))) return res.status(403).send("Origin rejected");
    next();
}

function issueCsrfToken(req, res) {
    const existingToken = parseCookies(req).csrf_token;
    if (typeof existingToken === "string" && existingToken.length >= 32) return existingToken;
    const token = randomToken();
    const attributes = [
        `csrf_token=${token}`,
        "Path=/guestbook",
        "HttpOnly",
        "SameSite=Strict",
        "Max-Age=3600"
    ];
    if (publicOrigin(req).startsWith("https://")) attributes.push("Secure");
    res.append("Set-Cookie", attributes.join("; "));
    return token;
}

function csrfProtection(req, res, next) {
    const cookieToken = parseCookies(req).csrf_token || "";
    const bodyToken = typeof req.body.csrfToken === "string" ? req.body.csrfToken : "";
    if (!safeEqual(cookieToken, bodyToken)) return res.status(403).send("Invalid CSRF token");
    next();
}

function createRateLimiter({ windowMs, max, key = req => req.ip }) {
    const buckets = new Map();
    return (req, res, next) => {
        const now = Date.now();
        if (buckets.size > 10000) {
            for (const [bucketKey, bucket] of buckets) {
                if (bucket.resetAt <= now) buckets.delete(bucketKey);
            }
        }
        const bucketKey = key(req);
        const current = buckets.get(bucketKey);
        if (!current || current.resetAt <= now) {
            buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
            return next();
        }
        current.count += 1;
        if (current.count > max) {
            res.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
            return res.status(429).send("Too many requests");
        }
        next();
    };
}

module.exports = {
    csrfProtection,
    createRateLimiter,
    getStoryToken,
    issueCsrfToken,
    normalizeName,
    publicOrigin,
    randomToken,
    safeEqual,
    sameOriginOnly,
    setStoryToken
};
