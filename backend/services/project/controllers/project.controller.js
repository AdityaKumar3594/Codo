import redis from "../../../shared/redis/redis.js";
import Project from "../models/project.model.js";

export const createProject=async (req,res)=>{
    try {
        const userId=req.headers["x-user-id"];
        if(!userId){
            return res.status(401).json({message:"Unauthorized"});
        }
        const {name,description}=req.body;
        const project=await Project.create({
            owner:userId,
            name,
            description
        });

        const key=`projects-${userId}`;
        await redis.del(key);
        await redis.del(`projects-starred-${userId}`);
        
        return res.status(201).json(project);
    } catch (error) {
        return res.status(500).json({message:"Create project error"});
    }
}

export const getProjects=async (req,res)=>{
    try {
        const userId=req.headers["x-user-id"];
        if(!userId){
            return res.status(401).json({message:"Unauthorized"});
        }

        const key=`projects-${userId}`;
        let result=await redis.get(key);
        if (result){
            return res.status(200).json(JSON.parse(result));
        }
        
        const projects=await Project.find({owner:userId}).sort({updatedAt:-1});
        await redis.set(key,JSON.stringify(projects));
        return res.status(200).json(projects);
    } catch (error) {
        return res.status(500).json({message:"Get projects error"});
    }
}


export const getProjectById=async (req,res)=>{
    try {
        const {id}=req.params;
        const project=await Project.findById(id);
        if(!project){
            return res.status(404).json({message:"Project not found"});
        }
        await project.updateOne({lastOpenedAt:Date.now()});
        return res.status(200).json({message:"Project fetched successfully",project});
    } catch (error) {
        return res.status(500).json({message:"Get project by id error"});
    }
}

export const getStarredProjects=async (req,res)=>{
    try {
        const userId=req.headers["x-user-id"];
        if(!userId){
            return res.status(401).json({message:"Unauthorized"});
        }

        const key=`projects-starred-${userId}`;
        let result=await redis.get(key);
        if (result){
            return res.status(200).json(JSON.parse(result));
        }

        const projects=await Project.find({owner:userId,starred:true}).sort({updatedAt:-1});
        await redis.set(key,JSON.stringify(projects));
        return res.status(200).json(projects);
    } catch (error) {
        return res.status(500).json({message:"Get starred projects error"});
    }
}

export const toggleStar =async (req,res)=>{
    try {
        const userId=req.headers["x-user-id"];
        const {id}=req.params;
        const project=await Project.findById(id);
        if(!project){
            return res.status(404).json({message:"Project not found"});
        }
        project.starred = !project.starred;
        await project.save();

        if (userId) {
            await redis.del(`projects-${userId}`);
            await redis.del(`projects-starred-${userId}`);
        }
        return res.status(200).json({message:"Project starred successfully", starred: project.starred});
    } catch (error) {
        return res.status(500).json({message:"Toggle star error"});
    }
}

export const deleteProject=async (req,res)=>{
    try {
        const userId=req.headers["x-user-id"];
        const {id}=req.params;
        const project=await Project.findByIdAndDelete(id);
        if(!project){
            return res.status(404).json({message:"Project not found"});
        }

        if (userId) {
            await redis.del(`projects-${userId}`);
            await redis.del(`projects-starred-${userId}`);
        }
        return res.status(200).json({message:"Project deleted successfully",project});
    } catch (error) {
        return res.status(500).json({message:"Delete project error"});
    }
}

