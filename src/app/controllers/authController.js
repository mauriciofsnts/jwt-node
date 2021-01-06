const express = require("express");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mailer = require("../../modules/mailer");

const authConfig = require("../../config/auth.json");

const router = express.Router();

function generateToken(params = {}) {
	return jwt.sign(params, authConfig.secret, {
		expiresIn: 86400,
	});
}

router.post("/register", async (req, res) => {
	try {
		const { email } = req.body;

		if (await User.findOne({ email }))
			return res.status(400).send({ error: "Usuário já cadastrado" });

		const user = await User.create(req.body);
		user.password = undefined;

		return res.send({ user, token: generateToken({ id: user.id }) });
	} catch (error) {
		return res.status(400).send({ error: "Ocorreu um erro ao salvar usuário: " + error });
	}
});

router.post("/authenticate", async (req, res) => {
	const { email, password } = req.body;

	const user = await User.findOne({ email }).select("+password");

	// Verifica se existe um usuário com o email do req.body
	if (!user) return res.status(400).send({ error: "Usuário não encontrado" });

	// Compara a senha informada do usuário com a senha salva no banco de dados
	if (!(await bcrypt.compare(password, user.password)))
		return res.status(400).send({ error: "Senha inválida" });

	// Remove o campo password (LPGD)
	user.password = undefined;

	res.send({ user, token: generateToken({ id: user.id }) });
});

router.post("/forgot_password", async (req, res) => {
	const { email } = req.body;

	try {
		const user = await User.findOne({ email });

		// Verifica se existe um usuário com o email do req.body
		if (!user) return res.status(400).send({ error: "Usuário não encontrado" });

		const token = crypto.randomBytes(20).toString("hex");

		const now = new Date();
		now.setHours(now.getHours() + 1);

		await User.findByIdAndUpdate(
			user.id,
			{
				$set: {
					passwordResetToken: token,
					passwordResetExpires: now,
				},
			},
			{ new: true, useFindAndModify: false }
		);

		mailer.sendMail(
			{
				to: email,
				from: "mauricio@gmail.com",
				template: "auth/forgot_password",
				context: { token },
			},
			(err) => {
				if (err)
					return res
						.status(400)
						.send({ error: "Não foi possível enviar o e-mail para resetar a senha" });

				return res.send();
			}
		);
	} catch (error) {
		res
			.status(400)
			.send({ error: "Ocorreu um erro no esqueci minha senha, tente novamente. " + error });
	}
});
 
router.post("/reset_password", async (req, res) => {
	const { email, token, password } = req.body;

	try {
		const user = await User.findOne({ email }).select("+passwordResetToken passwordResetExpires");

		// Verifica se existe um usuário com o email do req.body
		if (!user) return res.status(400).send({ error: "Usuário não encontrado" });

		if (token !== user.passwordResetToken) return res.status(400).send({ error: "Token inválido" });

		const now = new Date();

		if (now > user.passwordResetExpires) return res.status(400).send({ error: "Token expirado" });

		user.password = password;

		await user.save();

		res.send();
	} catch (error) {
		res.status(400).send({ error: "Não foi possível alterar a senha, tente novamente. " + error });
	}
});

module.exports = (app) => app.use("/auth", router);
