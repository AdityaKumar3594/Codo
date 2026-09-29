import redis from "../../shared/redis/redis"

export const protect=async (req,res,next)=>{
    try {
        const sessionId=req.cookies?.session

        if (!sessionId){
            return res.status(401).json({message:"unauthorized"})
        }

        //getting data from redis using token key

        const result = await redis.get(`session-${sessionId}`)
        if(!result){
            
            return res.status(401).json({message:"session not found"})

        }
        
        const data=JSON.parse(result)

        //data added to request so that it can be called in controller
        req.user=data
        next()
    } catch (error) {
        return res.status(500).json({message:`protect middleware error ${error}`})
        
    }

}