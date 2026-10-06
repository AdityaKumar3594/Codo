import { api } from "../utils/axios";

export const createProject=async ({name,description})=>{
    try {
        const response=await api.post("/api/project",{name,description});
        return response.data;
    } catch (error) {
        console.log("Error in createProject:",error)
        return null;
    }
}

export const getProjects=async()=>{
    try {
        const response=await api.get("/api/project");
        return response.data;
    } catch (error) {
        console.log("Error in getProjects:",error)
        return null;
    }
}



export const deleteProject=async({id})=>{
    try {
        const response=await api.delete(`/api/project/${id}`);
        return response.data;
    } catch (error) {
        console.log("Error in deleteProject:",error)
        return null;
    }
}

export const getProjectById=async({id})=>{
    try {
        const response=await api.get(`/api/project/${id}`);
        return response.data;
    } catch (error) {
        console.log("Error in getProjectById:",error)
        return null;
    }
}

export const getStarredProjects=async()=>{
    try {
        const response=await api.get("/api/project/starred");
        return response.data;
    } catch (error) {
        console.log("Error in getStarredProjects:",error)
        return null;
    }
}

export const toggleStar=async({id})=>{
    try {
        const response=await api.patch(`/api/project/${id}/star`);
        return response.data;
    } catch (error) {
        console.log("Error in toggleStar:",error)
        return null;
    }
}