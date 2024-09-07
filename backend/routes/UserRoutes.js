import express from 'express';
import User from '../models/User.js';
import { authMiddleware, isAdmin, isAuthenticated, isOwnerOrAdmin } from '../middlewares/authMiddleware.js';
import cloudinaryUploader from '../config/cloudinaryConfig.js';
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

// GET tutti gli utenti (solo admin)
router.get('/', authMiddleware, isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const users = await User.find()
            .select('-password')
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await User.countDocuments();

        res.json({
            users,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalUsers: count
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET profilo utente
router.get('/profile', authMiddleware, isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('orders')
            .populate('likedBeers');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', cloudinaryUploader.single("avatar"), async (req, res) => { 
    try { 
        const userData = req.body; 
        if (req.file) { 
            userData.avatar = req.file.path; 
        } else {
            // Se non viene fornito un avatar, rimuovi il campo dal userData
            delete userData.avatar;
        }
        const user = new User(userData); 
        const newUser = await user.save(); 
        //Rimuovo la password per sicurezza 
        const userRes = newUser.toObject(); 
        delete userRes.password; 
        res.status(201).json(userRes); 
    } catch (err) { 
        res.status(400).json({ message: err.message }); 
    } 
});

// UPDATE profilo utente
router.patch('/profile', authMiddleware, isAuthenticated, cloudinaryUploader.single("avatar"), async (req, res) => {
    try {
        const userData = req.body;
        const oldUser = await User.findById(req.user._id);

        if (req.file) {
            if (oldUser.avatar) {
                const publicId = `User-avatar/${oldUser.avatar.split('/').pop().split('.')[0]}`;
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryError) {
                    console.error("Errore nell'eliminazione del vecchio avatar:", cloudinaryError);
                }
            }
            userData.avatar = req.file.path;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            userData,
            { new: true, runValidators: true }
        ).select('-password');

        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE user (admin only)
router.patch('/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-password');
        if (!updatedUser) {
            return res.status(404).json({ message: "Utente non trovato" });
        }
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE user account
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);
        
        if (!userToDelete) {
            return res.status(404).json({ message: "Utente non trovato" });
        }

        const isSelfDelete = req.user._id.toString() === req.params.id;
        const isAdminUser = req.user.role === 'admin';

        if (isAdminUser && isSelfDelete) {
            return res.status(403).json({ message: "Gli amministratori non possono eliminare il proprio account" });
        }

        if (isSelfDelete || isAdminUser) {
            // Soft delete
            userToDelete.deletedAt = new Date();
            await userToDelete.save();

            if (userToDelete.avatar) {
                const publicId = `User-avatar/${userToDelete.avatar.split('/').pop().split('.')[0]}`;
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryError) {
                    console.error("Errore nell'eliminazione dell'avatar:", cloudinaryError);
                }
            }

            // Se l'utente ha eliminato il proprio account, invalida la sessione
            if (isSelfDelete) {
                res.clearCookie('jwt'); // Se stai usando cookie per i token
            }

            res.json({ message: "Account utente eliminato con successo" });
        } else {
            res.status(403).json({ message: "Non hai i permessi per eliminare questo account" });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET birre preferite dell'utente
router.get('/liked-beers', authMiddleware, isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('likedBeers');
        res.json(user.likedBeers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Aggiungi birra ai preferiti
router.post('/like-beer/:beerId', authMiddleware, isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user.likedBeers.includes(req.params.beerId)) {
            user.likedBeers.push(req.params.beerId);
            await user.save();
        }
        res.json({ message: "Birra aggiunta ai preferiti" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Rimuovi birra dai preferiti
router.delete('/unlike-beer/:beerId', authMiddleware, isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.likedBeers = user.likedBeers.filter(id => id.toString() !== req.params.beerId);
        await user.save();
        res.json({ message: "Birra rimossa dai preferiti" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


export default router;