import File from "../models/file.model.js"
import { buildTree } from "../utils/buildTree.js"

export const createRootFolder=async (req,res)=>{
    try {
        const {projectId,projectName}=req.body
        const userId=req.headers["x-user-id"] 
        if (!projectId || !projectName){
            return res.status(400).json({message:"Project id and name is required"})
        }

        const existingRootFolder=await File.findOne({projectId,parentId:null,isDeleted:false})
        if (existingRootFolder){
            return res.status(400).json({message:"Root folder already exists"})
        }

        const rootFolder=await File.create({
            name:projectName,
            type:"folder",
            projectId,
            owner:userId,
            parentId:null,
        })

        return res.status(201).json(rootFolder)
        
    } catch (error) {
        return res.status(500).json({message:`Error creating root folder: ${error}`})
    }
}
export const createFolder=async (req,res)=>{
    try {
        const {projectId,parentId,name}=req.body
        const userId=req.headers["x-user-id"] 
        if (!projectId || !name || !parentId){
            return res.status(400).json({message:"Project id , parent id and name is required"})
        }

        const exist=await File.findOne({projectId,parentId,name,isDeleted:false})
        if (exist){
            return res.status(400).json({message:"folder already exists"})
        }

        const folder=await File.create({
            name,
            type:"folder",
            projectId,
            owner:userId,
            parentId,
        })

        return res.status(201).json(folder)
        
    } catch (error) {
        return res.status(500).json({message:`Error creating folder: ${error}`})
    }
}
export const createFile=async (req,res)=>{
    try {
        const {projectId,parentId,name,content="",language="plaintext"}=req.body
        const userId=req.headers["x-user-id"] 
        if (!projectId || !name || !parentId){
            return res.status(400).json({message:"Project id , parent id and name is required"})
        }

        const exist=await File.findOne({projectId,parentId,name,isDeleted:false})
        if (exist){
            return res.status(400).json({message:"file already exists"})
        }

        const extension=name.includes(".") ? name.split(".").pop() : "" 

        const file=await File.create({
            name,
            type:"file",
            projectId,
            owner:userId,
            content,
            language,
            extension,
            size:content.length,
            parentId:parentId || null,
        })

        return res.status(201).json(file)
        
    } catch (error) {
        return res.status(500).json({message:`Error creating file: ${error}`})
    }
}
export const updateFile=async (req,res)=>{
    try {
        const {name,content}=req.body
        const userId=req.headers["x-user-id"] 
    
        const file=await File.findById(req.params.id)
        if (!file){
            return res.status(404).json({message:"file not found"})
        }

        if (name){
            file.name=name
            const extension=name.includes(".") ? name.split(".").pop() : "" 
            file.extension=extension 
        }
        if (content!=undefined){
            file.content=content
            file.size=content.length
        }
        await file.save()

        return res.status(200).json(file)
        
    } catch (error) {
        return res.status(500).json({message:`Error updating file: ${error}`})
    }
}

export const deleteFile=async(req,res)=>{
    try {
        const file=await File.findByIdAndUpdate(req.params.id,{
            isDeleted:true,
        })
        if (!file){
            return res.status(404).json({message:"file not found"})
        }
        return res.status(200).json(file)
    } catch (error) {
        return res.status(500).json({message:`Error deleting file: ${error}`})
    }
}

export const getFile=async(req,res)=>{
    try {
        const userId=req.headers["x-user-id"]
        const file=await File.findOne({
            _id:req.params.id,
            owner:userId,
            isDeleted:false
        })
        if (!file){
            return res.status(404).json({message:"file not found"})
        }
        return res.status(200).json(file)
    } catch (error) {
        return res.status(500).json({message:`Error getting file: ${error}`})
    }
}

export const getTree=async (req,res)=>{
    try {
        const userId=req.headers["x-user-id"]
        const {projectId}=req.params

        const files=await File.find({
            projectId,
            owner:userId,
            isDeleted:false
        }).sort({
            name:1,
            type:-1
        })

        if (!files){
            return res.status(404).json({message:"files not found"})
        }

        const tree=buildTree(files)

        return res.status(200).json(tree)
        
    } catch (error) {
        return res.status(500).json({message:`Error getting tree: ${error}`})
    }
}