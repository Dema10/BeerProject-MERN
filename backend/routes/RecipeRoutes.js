import express from 'express';
import Recipe from '../models/Recipe.js';
import Beer from '../models/Beer.js';
import { authMiddleware, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET tutte le ricette (solo admin)
router.get('/', authMiddleware, isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const recipes = await Recipe.find()
            .populate('associatedBeer', 'name')
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Recipe.countDocuments();

        res.json({
            recipes,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalRecipes: count
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET una ricetta specifica (solo admin)
router.get('/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id).populate('associatedBeer', 'name');
        if (!recipe) return res.status(404).json({ message: 'Ricetta non trovata' });
        res.json(recipe);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST una nuova ricetta (solo admin)
router.post('/', authMiddleware, isAdmin, async (req, res) => {
    try {
        const recipe = new Recipe(req.body);
        const newRecipe = await recipe.save();

        // Se c'è una birra associata, aggiorniamo anche il riferimento nella birra
        if (newRecipe.associatedBeer) {
            await Beer.findByIdAndUpdate(newRecipe.associatedBeer, { $set: { recipe: newRecipe._id } });
        }

        res.status(201).json(newRecipe);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE una ricetta (solo admin)
router.patch('/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
        const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedRecipe) return res.status(404).json({ message: 'Ricetta non trovata' });

        // Se la birra associata è cambiata, aggiorniamo i riferimenti
        if (req.body.associatedBeer) {
            // Rimuovi il riferimento dalla vecchia birra associata (se esistente)
            await Beer.updateMany(
                { recipe: updatedRecipe._id },
                { $unset: { recipe: "" } }
            );

            // Aggiungi il riferimento alla nuova birra associata
            await Beer.findByIdAndUpdate(req.body.associatedBeer, { $set: { recipe: updatedRecipe._id } });
        }

        res.json(updatedRecipe);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE una ricetta (solo admin)
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ message: 'Ricetta non trovata' });

        // Rimuovi il riferimento alla ricetta dalla birra associata
        if (recipe.associatedBeer) {
            await Beer.findByIdAndUpdate(recipe.associatedBeer, { $unset: { recipe: "" } });
        }

        await Recipe.findByIdAndDelete(req.params.id);
        res.json({ message: "Ricetta eliminata" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET ricette per una specifica birra (solo admin)
router.get('/beer/:beerId', authMiddleware, isAdmin, async (req, res) => {
    try {
        const recipes = await Recipe.find({ associatedBeer: req.params.beerId });
        res.json(recipes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST associa una ricetta esistente a una birra (solo admin)
router.post('/:id/associate-beer/:beerId', authMiddleware, isAdmin, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ message: 'Ricetta non trovata' });

        const beer = await Beer.findById(req.params.beerId);
        if (!beer) return res.status(404).json({ message: 'Birra non trovata' });

        recipe.associatedBeer = beer._id;
        await recipe.save();

        beer.recipe = recipe._id;
        await beer.save();

        res.json({ message: "Ricetta associata alla birra con successo" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;