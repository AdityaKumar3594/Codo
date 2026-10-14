import proxy from "express-http-proxy";

// express.json() has already consumed the body stream before this proxy runs.
// We must re-serialize req.body so downstream services receive it correctly.
export const proxyWithHeader = (serviceUrl) => {
    return proxy(serviceUrl, {
        timeout: 0,
        // Re-attach the parsed body as a Buffer so the proxy can forward it
        proxyReqBodyDecorator: (bodyContent, srcReq) => {
            if (srcReq.body && Object.keys(srcReq.body).length > 0) {
                return JSON.stringify(srcReq.body);
            }
            return bodyContent;
        },

        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            // Forward authenticated user id to downstream services
            if (srcReq.user) {
                proxyReqOpts.headers["x-user-id"] = String(srcReq.user._id);
            }
            // Ensure Content-Type is set for JSON bodies
            if (srcReq.body && Object.keys(srcReq.body).length > 0) {
                proxyReqOpts.headers["content-type"] = "application/json";
            }
            return proxyReqOpts;
        },
    });
};
