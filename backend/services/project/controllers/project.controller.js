import redis from "../../../shared/redis/redis.js";
import Project from "../models/project.model.js";

const CACHE_TTL = 3600; // 1 hour

export const createProject = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { name, description } = req.body;
        const project = await Project.create({ owner: userId, name, description });

        await redis.del(`projects-${userId}`);
        await redis.del(`projects-starred-${userId}`);

        return res.status(201).json(project);
    } catch (error) {
        return res.status(500).json({ message: "Create project error" });
    }
};

export const getProjects = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const key = `projects-${userId}`;
        const cached = await redis.get(key);
        if (cached) return res.status(200).json(JSON.parse(cached));

        const projects = await Project.find({ owner: userId }).sort({ updatedAt: -1 });
        await redis.set(key, JSON.stringify(projects), "EX", CACHE_TTL);
        return res.status(200).json(projects);
    } catch (error) {
        return res.status(500).json({ message: "Get projects error" });
    }
};

export const getProjectById = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { id } = req.params;
        // Authorization: only owner can view their project
        const project = await Project.findOne({ _id: id, owner: userId });
        if (!project) return res.status(404).json({ message: "Project not found" });

        // Update lastOpenedAt without waiting — fire and forget
        project.updateOne({ lastOpenedAt: Date.now() }).exec();

        return res.status(200).json({ message: "Project fetched successfully", project });
    } catch (error) {
        return res.status(500).json({ message: "Get project by id error" });
    }
};

export const getStarredProjects = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const key = `projects-starred-${userId}`;
        const cached = await redis.get(key);
        if (cached) return res.status(200).json(JSON.parse(cached));

        const projects = await Project.find({ owner: userId, starred: true }).sort({ updatedAt: -1 });
        await redis.set(key, JSON.stringify(projects), "EX", CACHE_TTL);
        return res.status(200).json(projects);
    } catch (error) {
        return res.status(500).json({ message: "Get starred projects error" });
    }
};

export const updateProject = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { id } = req.params;
        const { name, description } = req.body;

        const project = await Project.findOne({ _id: id, owner: userId });
        if (!project) return res.status(404).json({ message: "Project not found" });

        if (name) project.name = name;
        if (description !== undefined) project.description = description;
        await project.save();

        await redis.del(`projects-${userId}`);
        await redis.del(`projects-starred-${userId}`);

        return res.status(200).json(project);
    } catch (error) {
        return res.status(500).json({ message: "Update project error" });
    }
};

export const toggleStar = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { id } = req.params;
        // Authorization: only owner can star their project
        const project = await Project.findOne({ _id: id, owner: userId });
        if (!project) return res.status(404).json({ message: "Project not found" });

        project.starred = !project.starred;
        await project.save();

        await redis.del(`projects-${userId}`);
        await redis.del(`projects-starred-${userId}`);

        return res.status(200).json({ message: "Project starred successfully", starred: project.starred });
    } catch (error) {
        return res.status(500).json({ message: "Toggle star error" });
    }
};

export const deleteProject = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { id } = req.params;
        // Authorization: only owner can delete their project
        const project = await Project.findOneAndDelete({ _id: id, owner: userId });
        if (!project) return res.status(404).json({ message: "Project not found" });

        await redis.del(`projects-${userId}`);
        await redis.del(`projects-starred-${userId}`);

        return res.status(200).json({ message: "Project deleted successfully", project });
    } catch (error) {
        return res.status(500).json({ message: "Delete project error" });
    }
};
