// Middleware que intercepta a requsição e valida se o token utilizado ainda é válido
const jwt = require("jsonwebtoken");
const authConfig = require("../../config/auth.json");

module.exports = (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader) return res.status(401).send({ error: "O token não foi informado" });

	// Bearer ab9ee17d1734054c59437ccfab8dd85a = Token esperado
	// Separa o token em duas partes
	const parts = authHeader.split(" ");

	if (!parts.length === 2) return res.status(401).send({ error: "Token error" });

	const [scheme, token] = parts;

	// Verifica se o token possui "Bearer"
	if (!/^Bearer$/i.test(scheme)) return res.status(401).send({ error: "Token mal formatado" });

	jwt.verify(token, authConfig.secret, (err, decoded) => {
		if (err) return res.status(401).send({ error: "Token inválido" });

		req.userId = decoded.id;

		return next();
	});
};
