import { verifyJWT } from "../utils/jwt.js";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "Token mancante" });
        }

        const decoded = await verifyJWT(token);
        const user = await User.findById(decoded.id).select("-password");
        
        if (!user) {
            return res.status(401).json({ message: "Utente non trovato" });
        }

        req.user = user;
        console.log("Utente autenticato:", req.user._id);
        next();
    } catch (error) {
        res.status(401).json({ message: "Token non valido" });
    }
};

export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Accesso negato. Richiesti privilegi di amministratore." });
    }
};

export const isAuthenticated = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.status(401).json({ message: "Utente non autenticato" });
    }
};

export const isOwnerOrAdmin = (req, res, next) => {
    if (req.user.role === 'admin' || req.user._id.toString() === req.params.id) {
        next();
    } else {
        res.status(403).json({ message: "Accesso negato. Non sei il proprietario o un amministratore." });
    }
};