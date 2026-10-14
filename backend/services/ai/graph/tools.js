import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
    getTree,
    getFile,
    createFile,
    createFolder,
    updateFile,
    deleteFile,
} from "../utils/fetchFileAPIs.js";

// ─── compactTree ──────────────────────────────────────────────────────────────
// Strips heavy fields (content, size, isDeleted, owner, timestamps) so the LLM
// only sees what it needs to navigate and reference the tree.
const compactTree = (items = []) => {
    return items.map((item) => ({
        _id: item._id,
        parentId: item.parentId,
        name: item.name,
        type: item.type,
        language: item.language,
        extension: item.extension,
        children: compactTree(item.children || []),
    }));
};

// ─── Tool factory ─────────────────────────────────────────────────────────────
// projectId and userId are bound per-request so the tools don't need them
// in the input schema (the LLM should never see or guess IDs).

export const FileTools = (projectId, userId) => {

    const getTreeTool = tool(
        async () => {
            console.log("ai tool-get_tree");
            const tree = await getTree({ projectId, userId });
            if (!tree) {
                return JSON.stringify({
                    success: false,
                    operation: "tree_fetched",
                    error: "could not fetch project tree",
                });
            }
            return JSON.stringify({
                success: true,
                operation: "tree_fetched",
                tree: compactTree(tree),
            });
        },
        {
            name: "get_tree",
            description: `Get the complete project file and folder tree.

IMPORTANT:
1. Use this when the project structure is unknown.
2. Do not repeatedly call get_tree.
3. type="folder" means folder.
4. type="file" means file.
5. Folder IDs are used as parentId.
6. NEVER call get_file with a folder ID.
7. Do not use terminal commands to inspect the project.
8. Use the exact IDs returned by this tool.

The tree contains:
_id
parentId
name
type ("file" | "folder")
extension
language
children`,
            schema: z.object({}),
        }
    );

    const getFileTool = tool(
        async ({ fileId }) => {
            console.log("ai tool-get_file");
            const file = await getFile({ fileId, userId });
            if (!file) {
                return JSON.stringify({
                    success: false,
                    operation: "file_fetched",
                    error: `could not fetch file ${fileId}`,
                });
            }
            return JSON.stringify({
                success: true,
                operation: "file_fetched",
                file: {
                    _id: file._id,
                    name: file.name,
                    type: file.type,
                    parentId: file.parentId,
                    language: file.language,
                    content: file.content,
                },
            });
        },
        {
            name: "get_file",
            description: `Read the full content of a single file by its ID.

IMPORTANT:
1. Only call this with a file ID (type="file"), NEVER a folder ID.
2. Use get_tree first to discover file IDs.
3. Do not call this repeatedly on the same file.
4. Returns: _id, name, type, parentId, language, content.`,
            schema: z.object({
                fileId: z.string().describe("The _id of the file to read."),
            }),
        }
    );

    const createFileTool = tool(
        async ({ name, parentId, content, language }) => {
            console.log("ai tool-create_file");
            const file = await createFile({
                projectId,
                userId,
                name,
                parentId,
                content,
                language: language || "plaintext",
            });
            if (!file) {
                return JSON.stringify({
                    success: false,
                    operation: "file_created",
                    error: `could not create file "${name}"`,
                });
            }
            return JSON.stringify({
                success: true,
                operation: "file_created",
                file: {
                    _id: file._id,
                    name: file.name,
                    type: file.type,
                    parentId: file.parentId,
                    language: file.language,
                    content: file.content,
                },
            });
        },
        {
            name: "create_file",
            description: `Create a new file inside a folder.

IMPORTANT:
1. parentId must be a folder _id from get_tree.
2. name must include the file extension (e.g. "index.js").
3. Set language correctly: "javascript", "typescript", "html", "css", "python", etc.
4. content is the full file content as a string.
5. Do not create files that already exist — check get_tree first.`,
            schema: z.object({
                parentId: z.string().describe("_id of the parent folder."),
                name: z.string().describe("Filename including extension, e.g. index.js"),
                content: z.string().describe("Full content to write into the file."),
                language: z.string().optional().describe("Language identifier, e.g. javascript, html, css."),
            }),
        }
    );

    const createFolderTool = tool(
        async ({ name, parentId }) => {
            console.log("ai tool-create_folder");
            const folder = await createFolder({ projectId, parentId, name, userId });
            if (!folder) {
                return JSON.stringify({
                    success: false,
                    operation: "folder_created",
                    error: `could not create folder "${name}"`,
                });
            }
            return JSON.stringify({
                success: true,
                operation: "folder_created",
                folder: {
                    _id: folder._id,
                    name: folder.name,
                    type: folder.type,
                    parentId: folder.parentId,
                },
            });
        },
        {
            name: "create_folder",
            description: `Create a new folder inside an existing folder.

IMPORTANT:
1. parentId must be a folder _id from get_tree.
2. Do not create folders that already exist.
3. Use lowercase, hyphen-separated names (e.g. "components", "api-routes").`,
            schema: z.object({
                parentId: z.string().describe("_id of the parent folder."),
                name: z.string().describe("Folder name, e.g. components"),
            }),
        }
    );

    const updateFileTool = tool(
        async ({ fileId, content, name }) => {
            console.log("ai tool-update_file");
            const file = await updateFile({ fileId, userId, name, content });
            if (!file) {
                return JSON.stringify({
                    success: false,
                    operation: "file_updated",
                    error: `could not update file ${fileId}`,
                });
            }
            return JSON.stringify({
                success: true,
                operation: "file_updated",
                file: {
                    _id: file._id,
                    name: file.name,
                    type: file.type,
                    parentId: file.parentId,
                    language: file.language,
                    content: file.content,
                },
            });
        },
        {
            name: "update_file",
            description: `Overwrite a file's content, or rename it.

IMPORTANT:
1. fileId must be a file _id (type="file") — never a folder.
2. Provide the COMPLETE new content — partial updates are not supported.
3. You may update name, content, or both in a single call.
4. Always read the file with get_file before modifying it.`,
            schema: z.object({
                fileId: z.string().describe("_id of the file to update."),
                content: z.string().optional().describe("New full content to write."),
                name: z.string().optional().describe("New filename (including extension)."),
            }),
        }
    );

    const deleteFileTool = tool(
        async ({ fileId }) => {
            console.log("ai tool-delete_file");
            const result = await deleteFile({ fileId, userId });
            if (!result) {
                return JSON.stringify({
                    success: false,
                    operation: "file_deleted",
                    error: `could not delete ${fileId}`,
                });
            }
            return JSON.stringify({
                success: true,
                operation: "file_deleted",
                file: {
                    _id: fileId,
                },
            });
        },
        {
            name: "delete_file",
            description: `Delete a file or folder by ID.

IMPORTANT:
1. Deleting a folder also deletes ALL its children recursively.
2. This action is irreversible — confirm with the user before deleting folders.
3. Only delete what the user explicitly asked to remove.`,
            schema: z.object({
                fileId: z.string().describe("_id of the file or folder to delete."),
            }),
        }
    );

    return [getTreeTool, getFileTool, createFileTool, createFolderTool, updateFileTool, deleteFileTool];
};
