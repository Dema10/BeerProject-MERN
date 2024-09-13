import express from 'express';
import CarouselImage from '../models/CarouselImage.js';
import { authMiddleware, isAdmin } from '../middlewares/authMiddleware.js';
import cloudinaryUploader from '../config/cloudinaryConfig.js';
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

// GET tutte le immagini del carosello attive
router.get('/', async (req, res) => {
    try {
        const images = await CarouselImage.find({ isActive: true }).sort('order');
        res.json(images);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST nuova immagine del carosello (solo admin)
router.post('/', authMiddleware, isAdmin, cloudinaryUploader.single("image"), async (req, res) => {
    try {
        const imageData = {
            title: req.body.title,
            description: req.body.description,
            imageUrl: req.file.path,
            order: req.body.order
        };
        const carouselImage = new CarouselImage(imageData);
        const newImage = await carouselImage.save();
        res.status(201).json(newImage);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH aggiorna immagine del carosello (solo admin)
router.patch('/:id', authMiddleware, isAdmin, cloudinaryUploader.single("image"), async (req, res) => {
    try {
        const imageData = {};
        if (req.body.title) imageData.title = req.body.title;
        if (req.body.description) imageData.description = req.body.description;
        if (req.body.order) imageData.order = req.body.order;
        if (req.body.isActive !== undefined) imageData.isActive = req.body.isActive;
        if (req.file) imageData.imageUrl = req.file.path;

        const updatedImage = await CarouselImage.findByIdAndUpdate(
            req.params.id, 
            imageData, 
            { new: true, runValidators: true }
        );

        if (!updatedImage) {
            return res.status(404).json({ message: "Immagine del carosello non trovata" });
        }

        res.json(updatedImage);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE immagine del carosello (solo admin)
router.delete('/:id', cloudinaryUploader.single("imageUrl"), authMiddleware, isAdmin, async (req, res) => {
    try {
        const image = await CarouselImage.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ message: "Immagine del carosello non trovata" });
        }

        // Elimina l'immagine da Cloudinary
        if (image.imageUrl) {
            // Estrai l'public_id da Cloudinary dall'URL della imageUrl
            const publicId = `Beer-image/${image.imageUrl.split('/').pop().split('.')[0]}`;
            console.log("Extracted publicId:", publicId);
            // Elimina l'immagine da Cloudinary
            try {
                const result = await cloudinary.uploader.destroy(publicId);
                console.log("Cloudinary deletion result:", result);
            } catch (cloudinaryError) {
                console.error("Cloudinary deletion error:", cloudinaryError);
            }
        }

        // Elimina l'immagine dal database
        await CarouselImage.findByIdAndDelete(req.params.id);
        
        res.json({ message: "Immagine eliminata dal carosello e da Cloudinary" });
    } catch (err) {
        console.error("Errore nell'eliminazione dell'immagine:", err);
        res.status(500).json({ message: "Errore del server durante l'eliminazione dell'immagine" });
    }
});

export default router;