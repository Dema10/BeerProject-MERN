import express from 'express';
import Production from '../models/Production.js';
import { authMiddleware, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET all productions (admin only)
router.get('/', authMiddleware, isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const productions = await Production.find()
            .populate('recipe', 'name')
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Production.countDocuments();

        res.json({
            productions,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalProductions: count
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET a specific production (admin only)
router.get('/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
        const production = await Production.findById(req.params.id).populate('recipe', 'name');
        if (!production) return res.status(404).json({ message: 'Produzione non trovata' });
        res.json(production);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new production (admin only)
router.post('/', authMiddleware, isAdmin, async (req, res) => {
    try {
        const production = new Production(req.body);
        const newProduction = await production.save();
        res.status(201).json(newProduction);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE a production (admin only)
router.patch('/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
        const updatedProduction = await Production.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedProduction) return res.status(404).json({ message: 'Produzione non trovata' });
        res.json(updatedProduction);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE a production (admin only)
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
        const production = await Production.findByIdAndDelete(req.params.id);
        if (!production) return res.status(404).json({ message: 'Produzione non trovata' });
        res.json({ message: "Produzione eliminata" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;