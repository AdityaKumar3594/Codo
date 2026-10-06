import { createSlice } from "@reduxjs/toolkit";

const projectSlice = createSlice({
    name: "project",
    initialState: {
        projects: [],
        currentProject: null,
        loading: false,
        creating: false,
        actionLoading: {}, // { [projectId]: 'starring' | 'deleting' }
        error: null,
    },
    reducers: {
        setProjects: (state, action) => {
            state.projects = action.payload;
            state.loading = false;
            state.error = null;
        },
        addProject: (state, action) => {
            state.projects.unshift(action.payload);
            state.creating = false;
        },
        updateProject: (state, action) => {
            const index = state.projects.findIndex((p) => p._id === action.payload._id);
            if (index !== -1) {
                state.projects[index] = { ...state.projects[index], ...action.payload };
            }
        },
        toggleStarProject: (state, action) => {
            const id = action.payload;
            const project = state.projects.find((p) => p._id === id);
            if (project) {
                project.starred = !project.starred;
            }
        },
        removeProject: (state, action) => {
            const id = action.payload;
            state.projects = state.projects.filter((p) => p._id !== id);
            delete state.actionLoading[id];
        },
        setCurrentProject: (state, action) => {
            state.currentProject = action.payload;
        },
        setProjectLoading: (state, action) => {
            state.loading = action.payload;
        },
        setCreatingProject: (state, action) => {
            state.creating = action.payload;
        },
        setActionLoading: (state, action) => {
            const { id, type } = action.payload;
            if (type) {
                state.actionLoading[id] = type;
            } else {
                delete state.actionLoading[id];
            }
        },
        setProjectError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
            state.creating = false;
        },
    },
});

export const {
    setProjects,
    addProject,
    updateProject,
    toggleStarProject,
    removeProject,
    setCurrentProject,
    setProjectLoading,
    setCreatingProject,
    setActionLoading,
    setProjectError,
} = projectSlice.actions;

export default projectSlice.reducer;
