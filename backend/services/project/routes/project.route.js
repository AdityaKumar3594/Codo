import express from "express";
import {
    createProject,
    getProjects,
    getProjectById,
    getStarredProjects,
    updateProject,
    toggleStar,
    deleteProject
} from "../controllers/project.controller.js";

const router = express.Router();

router.post("/",createProject);
router.get("/",getProjects);
router.get("/starred",getStarredProjects);
router.get("/:id",getProjectById);
router.patch("/:id/star",toggleStar);
router.patch("/:id",updateProject);
router.delete("/:id",deleteProject);

export default router;  