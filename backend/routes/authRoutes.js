import express from "express";
import User from "../models/User.js";
import { generateJWT } from "../utils/jwt.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http:localhost:5174";

const router = express.Router();

// POST /login per restituire il token per l'accesso
router.post("/login", async (req, res) =>{
    try {
        const { email, password } = req.body;

        // cerco l'user/admin nel db grazie alla mail
        const user = await User.findOne({ email });
        console.log(user);
        if (!user) {
            return res.status(401).json({ message: "Email non valida" });
        }

        // verifico la password
        const pass = await user.comparePassword(password)
        if (!pass) {
            return res.status(401).json({ message: "Password non valida" });
        }

        // se tutto corretto genero il token
        const token = await generateJWT({ id: user._id });
        console.log(token);

        res.json({ token, message: "Login effetuato con successo" });
    } catch (err) {
        console.error("Errore nella login:", err);
        res.status(500).json({ message: "Errore del server" });  
    }
});

// GET /me rotta che restituisce l'user/admin loggato
router.get("/me", authMiddleware, (req, res) => {
    const userData = req.user.toObject();
    // elimino la password sempre per sicurezza
    delete userData.password;
    res.json(userData);
});

export default router;