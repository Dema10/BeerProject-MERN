import express from 'express';
import Beer from '../models/Beer.js';
import User from '../models/User.js';
import cloudinaryUploader from '../config/cloudinaryConfig.js';
import { v2 as cloudinary } from "cloudinary";
import { authMiddleware, isAdmin, isAuthenticated } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET all beers
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const beers = await Beer.find({ inProduction: true })
            .populate('comments')
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Beer.countDocuments({ inProduction: true });

        res.json({
            beers,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalBeers: count
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET a specific beer
router.get('/:id', async (req, res) => {
    try {
        const beer = await Beer.findById(req.params.id).populate('comments');
        if (!beer) {
            return res.status(404).json({ message: 'Birra non trovata' });
        }
        res.json(beer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new beer (admin only)
router.post('/', authMiddleware, isAdmin, cloudinaryUploader.single("image"), async (req, res) => {
    try {
        const beerData = req.body;
        if (req.file) {
            beerData.image = req.file.path;
        }
        const beer = new Beer(beerData);
        const newBeer = await beer.save();
        res.status(201).json(newBeer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE a beer (admin only)
router.patch('/:id', authMiddleware, isAdmin, cloudinaryUploader.single("image"), async (req, res) => {
    try {
        const beerData = req.body;
        const oldBeer = await Beer.findById(req.params.id);

        if (!oldBeer) {
            return res.status(404).json({ message: "Birra non trovata" });
        }

        if (req.file) {
            if (oldBeer.image) {
                const publicId = `Beer-image/${oldBeer.image.split('/').pop().split('.')[0]}`;
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryError) {
                    console.error("Errore nell'eliminazione della vecchia immagine:", cloudinaryError);
                }
            }
            beerData.image = req.file.path;
        }

        const updatedBeer = await Beer.findByIdAndUpdate(
            req.params.id,
            beerData,
            { new: true }
        );

        res.json(updatedBeer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE a beer (admin only)
router.delete('/:id', cloudinaryUploader.single("image"), authMiddleware, isAdmin, async (req, res) => {
    try {
        const beer = await Beer.findById(req.params.id);
        if (!beer) {
            return res.status(404).json({ message: "Birra non trovata" });
        }

        if (beer.image) {
            const publicId = `Beer-image/${beer.image.split('/').pop().split('.')[0]}`;
            console.log("Extracted publicId:", publicId);
            try {
                const result = await cloudinary.uploader.destroy(publicId);
                console.log("Cloudinary deletion result:", result);
            } catch (cloudinaryError) {
                console.error("Errore nell'eliminazione dell'immagine:", cloudinaryError);
            }
        }

        await Beer.findByIdAndDelete(req.params.id);
        
        res.json({ message: "Birra e immagine eliminate" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// LIKE a beer
router.post('/:id/like', authMiddleware, isAuthenticated, async (req, res) => {
    try {
        const beer = await Beer.findById(req.params.id);
        if (!beer) return res.status(404).json({ message: 'Birra non trovata' });

        if (!beer.likes.includes(req.user._id)) {
            beer.likes.push(req.user._id);
            await beer.save();

            // Aggiorna anche l'utente
            await User.findByIdAndUpdate(req.user._id, { $addToSet: { likedBeers: beer._id } });
        }

        res.json({ message: "Like aggiunto" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;