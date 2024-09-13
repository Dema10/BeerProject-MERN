import express from 'express';
import StockMaterial from '../models/StockMaterial.js';
import { authMiddleware, isAdmin } from '../middlewares/authMiddleware.js';
import cloudinaryUploader from '../config/cloudinaryConfig.js';
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

// GET all stock materials (admin only)
router.get('/', authMiddleware, isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const stockMaterials = await StockMaterial.find()
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await StockMaterial.countDocuments();

        res.json({
            stockMaterials,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalStockMaterials: count
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET a specific stock material (admin only)
router.get('/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
        const stockMaterial = await StockMaterial.findById(req.params.id);
        if (!stockMaterial) return res.status(404).json({ message: 'Materiale non trovato' });
        res.json(stockMaterial);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new stock material (admin only)
router.post('/', authMiddleware, isAdmin, cloudinaryUploader.single("img"), async (req, res) => {
    try {
        const stockMaterialData = req.body;
        if (req.file) {
            stockMaterialData.img = req.file.path;
        }
        const stockMaterial = new StockMaterial(stockMaterialData);
        const newStockMaterial = await stockMaterial.save();
        res.status(201).json(newStockMaterial);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE a stock material (admin only)
router.patch('/:id', authMiddleware, isAdmin, cloudinaryUploader.single("img"), async (req, res) => {
    try {
        const stockMaterialData = req.body;
        const oldStockMaterial = await StockMaterial.findById(req.params.id);

        if (!oldStockMaterial) {
            return res.status(404).json({ message: "Materiale non trovato" });
        }

        if (req.file) {
            if (oldStockMaterial.img) {
                const publicId = `Beer-image/${oldStockMaterial.img.split('/').pop().split('.')[0]}`;
                console.log("Extracted publicId:", publicId);
                try {
                    const result = await cloudinary.uploader.destroy(publicId);
                    console.log("Cloudinary deletion result:", result);
                } catch (cloudinaryError) {
                    console.error("Errore nell'eliminazione della vecchia immagine:", cloudinaryError);
                }
            }
            stockMaterialData.img = req.file.path;
        }

        const updatedStockMaterial = await StockMaterial.findByIdAndUpdate(
            req.params.id,
            stockMaterialData,
            { new: true, runValidators: true }
        );

        res.json(updatedStockMaterial);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE a stock material (admin only)
router.delete('/:id', cloudinaryUploader.single("img"), authMiddleware, isAdmin, async (req, res) => {
    try {
        const stockMaterial = await StockMaterial.findById(req.params.id);
        if (!stockMaterial) return res.status(404).json({ message: 'Materiale non trovato' });

        if (stockMaterial.img) {
            const publicId = `Beer-image/${oldStockMaterial.img.split('/').pop().split('.')[0]}`;
            console.log("Extracted publicId:", publicId);
            try {
                const result = await cloudinary.uploader.destroy(publicId);
                console.log("Cloudinary deletion result:", result);
            } catch (cloudinaryError) {
                console.error("Errore nell'eliminazione della vecchia immagine:", cloudinaryError);
            }
        }

        await StockMaterial.findByIdAndDelete(req.params.id);
        res.json({ message: "Materiale eliminato" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;