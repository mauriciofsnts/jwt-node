const express = require("express");
const authMiddleware = require("../middlewares/auth");
const router = express.Router();

const Project = require("../models/project");
const Task = require("../models/task");

router.use(authMiddleware);

router.get("/", async (req, res) => {
	try {
		const projects = await Project.find().populate(["user", "tasks"]);

		return res.send({ projects });
	} catch (error) {
		return res.status(400).send({ error: "Ocorreu um erro ao listar projetos, " + error });
	}
});

router.get("/:projectId", async (req, res) => {
	try {
		const project = await Project.findById(req.params.projectId).populate("user");

		return res.send({ project });
	} catch (error) {
		return res.status(400).send({ error: "Ocorreu um erro ao listar projeto, " + error });
	}
});

router.post("/", async (req, res) => {
	try {
		const { title, description, tasks } = req.body;

		const project = await Project.create({ title, description, user: req.userId });

		await Promise.all(
			tasks.map(async (task) => {
				const projectTask = new Task({ ...task, project: project._id });

				// Cria as tasks individualmente
				await projectTask.save();

				project.tasks.push(projectTask);
			})
		);

		// Adiciona as tasks ao projeto
		await project.save();

		return res.send({ project });
	} catch (error) {
		return res.status(400).send({ error: "Ocorreu um erro ao criar um novo projeto, " + error });
	}
});

router.put("/:projectId", async (req, res) => {
	try {
		const { title, description, tasks } = req.body;

		const project = await Project.findByIdAndUpdate(
			req.params.projectId,
			{
				title,
				description,
			},
			{ new: true }
		);

		project.tasks = [];
		await Task.remove({ project: project._id });

		await Promise.all(
			tasks.map(async (task) => {
				const projectTask = new Task({ ...task, project: project._id });

				// Cria as tasks individualmente
				await projectTask.save();

				project.tasks.push(projectTask);
			})
		);

		// Adiciona as tasks ao projeto
		await project.save();

		return res.send({ project });
	} catch (error) {
		return res.status(400).send({ error: "Ocorreu um erro ao editar o projeto, " + error });
	}
});

router.delete("/:projectId", async (req, res) => {
	try {
		const project = await Project.findById(req.params.projectId);

		if (!project) return res.status(400).send({ error: "Projeto não encontrado" });

		await Project.findByIdAndDelete(req.params.projectId);

		return res.send();
	} catch (error) {
		return res.status(400).send({ error: "Ocorreu um erro ao deletar o projeto, " + error });
	}
});

module.exports = (app) => app.use("/projects", router);
