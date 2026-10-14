import File from "../models/file.model.js"
import { buildTree } from "../utils/buildTree.js"

export const createRootFolder = async (req, res) => {
    try {
        const { projectId, projectName } = req.body
        const userId = req.headers["x-user-id"]
        if (!projectId || !projectName) {
            return res.status(400).json({ message: "Project id and name is required" })
        }

        const existingRootFolder = await File.findOne({ projectId, parentId: null, isDeleted: false })
        if (existingRootFolder) {
            return res.status(400).json({ message: "Root folder already exists" })
        }

        const rootFolder = await File.create({
            name: projectName,
            type: "folder",
            projectId,
            owner: userId,
            parentId: null,
        })

        return res.status(201).json(rootFolder)
    } catch (error) {
        return res.status(500).json({ message: "Error creating root folder" })
    }
}

export const createFolder = async (req, res) => {
    try {
        const { projectId, parentId, name } = req.body
        const userId = req.headers["x-user-id"]
        if (!projectId || !name || !parentId) {
            return res.status(400).json({ message: "Project id, parent id and name are required" })
        }

        const exist = await File.findOne({ projectId, parentId, name, isDeleted: false })
        if (exist) {
            return res.status(400).json({ message: "Folder already exists" })
        }

        const folder = await File.create({
            name,
            type: "folder",
            projectId,
            owner: userId,
            parentId,
        })

        return res.status(201).json(folder)
    } catch (error) {
        return res.status(500).json({ message: "Error creating folder" })
    }
}

export const createFile = async (req, res) => {
    try {
        const { projectId, parentId, name, content = "", language = "plaintext" } = req.body
        const userId = req.headers["x-user-id"]
        if (!projectId || !name || !parentId) {
            return res.status(400).json({ message: "Project id, parent id and name are required" })
        }

        const exist = await File.findOne({ projectId, parentId, name, isDeleted: false })
        if (exist) {
            return res.status(400).json({ message: "File already exists" })
        }

        const extension = name.includes(".") ? name.split(".").pop() : ""

        const file = await File.create({
            name,
            type: "file",
            projectId,
            owner: userId,
            content,
            language,
            extension,
            size: content.length,
            parentId: parentId || null,
        })

        return res.status(201).json(file)
    } catch (error) {
        return res.status(500).json({ message: "Error creating file" })
    }
}

export const updateFile = async (req, res) => {
    try {
        const { name, content } = req.body
        const userId = req.headers["x-user-id"]

        // Authorization: only owner can update
        const file = await File.findOne({ _id: req.params.id, owner: userId, isDeleted: false })
        if (!file) {
            return res.status(404).json({ message: "File not found" })
        }

        if (name) {
            file.name = name
            file.extension = name.includes(".") ? name.split(".").pop() : ""
        }
        if (content !== undefined) {
            file.content = content
            file.size = content.length
        }
        await file.save()

        return res.status(200).json(file)
    } catch (error) {
        return res.status(500).json({ message: "Error updating file" })
    }
}

// Recursively soft-delete a node and all its descendants
const cascadeDelete = async (fileId) => {
    await File.findByIdAndUpdate(fileId, { isDeleted: true })
    const children = await File.find({ parentId: fileId, isDeleted: false })
    await Promise.all(children.map((child) => cascadeDelete(child._id)))
}

export const deleteFile = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"]

        // Authorization: only owner can delete
        const file = await File.findOne({ _id: req.params.id, owner: userId, isDeleted: false })
        if (!file) {
            return res.status(404).json({ message: "File not found" })
        }

        await cascadeDelete(file._id)

        return res.status(200).json({ message: "Deleted successfully", _id: file._id })
    } catch (error) {
        return res.status(500).json({ message: "Error deleting file" })
    }
}

export const getFile = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"]
        const file = await File.findOne({
            _id: req.params.id,
            owner: userId,
            isDeleted: false,
        })
        if (!file) {
            return res.status(404).json({ message: "File not found" })
        }
        return res.status(200).json(file)
    } catch (error) {
        return res.status(500).json({ message: "Error getting file" })
    }
}

export const getTree = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"]
        const { projectId } = req.params

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const files = await File.find({
            projectId,
            owner: userId,
            isDeleted: false,
        }).sort({ name: 1 })

        const sorted = [...files].sort((a, b) => {
            if (a.type !== b.type) return a.type === "folder" ? -1 : 1
            return a.name.localeCompare(b.name)
        })

        const tree = buildTree(sorted)
        return res.status(200).json(tree)
    } catch (error) {
        console.error("getTree error:", error.message, error.stack)
        return res.status(500).json({ message: "Error getting tree", detail: error.message })
    }
}

