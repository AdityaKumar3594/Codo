import proxy from "express-http-proxy";

export const proxyWithHeader=(serviceUrl)=>{
    return proxy(serviceUrl,{ 
        proxyReqOptDecorator:(proxyReqOpts, req) => {
            if(req.user){
                proxyReqOpts.headers["X-USER-ID"]=req.user?._id;
            }
            
            return proxyReqOpts;
        },
    })

}   