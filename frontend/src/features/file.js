import { api } from "../utils/axios";

// POST /api/file/create-root-folder  → returns root folder object directly
export const createRootFolder = async ({ projectId, projectName }) => {
    try {
        const { data } = await api.post("/api/file/create-root-folder", { projectId, projectName });
        return data;
    } catch (error) {
        console.error("createRootFolder:", error?.response?.data || error.message);
        return null;
    }
};

// POST /api/file/create-folder  → returns folder object directly
export const createFolder = async ({ projectId, parentId, name }) => {
    try {
        const { data } = await api.post("/api/file/create-folder", { projectId, parentId, name });
        return data;
    } catch (error) {
        console.error("createFolder:", error?.response?.data || error.message);
        return null;
    }
};

// POST /api/file/create-file  → returns file object directly
export const createFile = async ({ projectId, parentId, name, content = "", language = "plaintext" }) => {
    try {
        const { data } = await api.post("/api/file/create-file", { projectId, parentId, name, content, language });
        return data;
    } catch (error) {
        console.error("createFile:", error?.response?.data || error.message);
        return null;
    }
};

// POST /api/file/update/:id  → returns updated file object directly
export const updateFile = async ({ id, name, content }) => {
    try {
        const { data } = await api.post(`/api/file/update/${id}`, { name, content });
        return data;
    } catch (error) {
        console.error("updateFile:", error?.response?.data || error.message);
        return null;
    }
};

// DELETE /api/file/:id  → returns pre-update file object (soft delete)
export const deleteFile = async ({ id }) => {
    try {
        const { data } = await api.delete(`/api/file/${id}`);
        return data;
    } catch (error) {
        console.error("deleteFile:", error?.response?.data || error.message);
        return null;
    }
};

// GET /api/file/:id  → returns file object directly
export const getFile = async ({ id }) => {
    try {
        const { data } = await api.get(`/api/file/${id}`);
        return data;
    } catch (error) {
        console.error("getFile:", error?.response?.data || error.message);
        return null;
    }
};

// GET /api/file/tree/:projectId  → returns bare array of root nodes with children[]
export const getTree = async ({ projectId }) => {
    try {
        const { data } = await api.get(`/api/file/tree/${projectId}`);
        return data; // bare array: [{ _id, name, type, children: [...] }]
    } catch (error) {
        console.error("getTree:", error?.response?.data || error.message);
        return null;
    }
};
