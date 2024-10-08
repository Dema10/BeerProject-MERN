import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Orders.js';
import User from '../models/User.js';
import Beer from '../models/Beer.js';
import { authMiddleware, isAdmin, isAuthenticated } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Funzione di utilità per verificare la disponibilità e calcolare il prezzo totale
const validateOrderAndCalculateTotal = async (beers) => {
    let total = 0;
    for (let item of beers) {
        const beer = await Beer.findById(item.beer);
        if (!beer) throw new Error(`Birra con id ${item.beer} non trovata`);

        // Trova lo stock della birra (assumiamo che il nome dello stock corrisponda al nome della birra)
        const stock = await StockMaterial.findOne({ name: beer.name });
        if (!stock) throw new Error(`Stock non trovato per la birra ${beer.name}`);

        if (stock.quantity < item.quantity) {
            throw new Error(`Quantità insufficiente per ${beer.name}. Disponibili: ${stock.quantity}`);
        }

        total += stock.price * item.quantity;
    }
    return Number(total.toFixed(2));
};

// GET all orders (admin only)
router.get('/', authMiddleware, isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
        console.log('Received query params:', { page, limit, sort });

        let sortOption = {};
        let aggregatePipeline = [];

        // Gestione dell'ordinamento
        if (sort === 'totalQuantity' || sort === '-totalQuantity') {
            console.log('Using totalQuantity sorting');
            aggregatePipeline = [
                { $addFields: { 
                    totalQuantity: { $sum: "$beers.quantity" } 
                }},
                { $sort: { totalQuantity: sort.startsWith('-') ? -1 : 1 } },
                { $skip: (Number(page) - 1) * Number(limit) },
                { $limit: Number(limit) }
            ];
        } else {
            if (sort.startsWith('-')) {
                sortOption[sort.substr(1)] = -1;
            } else {
                sortOption[sort] = 1;
            }
            aggregatePipeline = [
                { $sort: sortOption },
                { $skip: (Number(page) - 1) * Number(limit) },
                { $limit: Number(limit) }
            ];
        }

        // Esegui l'aggregazione
        let orders = await Order.aggregate(aggregatePipeline);

        // Popola il campo 'user' dopo l'aggregazione
        orders = await Order.populate(orders, [
            { path: 'user', select: 'name surname' },
            { path: 'beers.beer', select: 'name' }
        ]);

        const count = await Order.countDocuments();

        res.json({
            orders,
            currentPage: Number(page),
            totalPages: Math.ceil(count / Number(limit)),
            totalOrders: count
        });
    } catch (err) {
        console.error('Error in order retrieval:', err);
        res.status(500).json({ message: err.message });
    }
});


// GET user's orders
router.get('/myorders', authMiddleware, isAuthenticated, async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
        const orders = await Order.find({ user: req.user._id })
            .populate('beers.beer', 'name price')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Order.countDocuments({ user: req.user._id });

        res.json({
            orders,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalOrders: count,
            hasNextPage: page * limit < count,
            hasPrevPage: page > 1
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new order
router.post('/', authMiddleware, isAuthenticated, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { beers } = req.body;
        
        const totalPrice = await validateOrderAndCalculateTotal(beers);

        // Crea e salva l'ordine
        const order = new Order({
            user: req.user._id,
            beers: await Promise.all(beers.map(async item => {
                const beer = await Beer.findById(item.beer);
                const stock = await StockMaterial.findOne({ name: beer.name });
                return {
                    beer: item.beer,
                    quantity: item.quantity,
                    price: stock.price
                };
            })),
            totalPrice: totalPrice,
            status: 'pending'
        });
        await order.save({ session });

        // Aggiorna il magazzino
        for (let item of beers) {
            const beer = await Beer.findById(item.beer);
            await StockMaterial.findOneAndUpdate(
                { name: beer.name },
                { $inc: { quantity: -item.quantity } },
                { session }
            );
        }

        // Aggiorna gli ordini dell'utente
        await User.findByIdAndUpdate(req.user._id, 
            { $push: { orders: order._id } },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        res.status(201).json(order);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: err.message });
    }
});

// UPDATE order status (admin only)
router.patch('/:id/status', authMiddleware, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id).populate('beers.beer');

        if (!order) {
            return res.status(404).json({ message: 'Ordine non trovato' });
        }

        if (order.status !== 'pending' && status === 'pending') {
            return res.status(400).json({ message: 'Non è possibile tornare allo stato "pending" da uno stato successivo' });
        }

        order.status = status;
        await order.save();

        res.json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE an order (user can delete only pending orders, admin can delete any order)
router.delete('/:id', authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findById(req.params.id).populate('beers.beer').session(session);
        if (!order) {
            return res.status(404).json({ message: 'Ordine non trovato' });
        }

        // Check if the user is authorized to delete the order
        if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorizzato a eliminare questo ordine' });
        }

        // Users can only delete pending orders
        if (req.user.role !== 'admin' && order.status !== 'pending') {
            return res.status(400).json({ message: 'Solo gli ordini in attesa possono essere eliminati' });
        }

        // If the order is pending, restore the beer quantities
        if (order.status === 'pending') {
            for (const item of order.beers) {
                await Beer.findByIdAndUpdate(
                    item.beer._id,
                    { $inc: { quantity: item.quantity } },
                    { session }
                );
            }
        }

        // Remove the order from the user's orders list
        await User.findByIdAndUpdate(order.user, { $pull: { orders: order._id } }, { session });

        // Delete the order
        await Order.findByIdAndDelete(req.params.id).session(session);

        await session.commitTransaction();
        res.json({ message: "Ordine eliminato con successo" });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ message: err.message });
    } finally {
        session.endSession();
    }
});

export default router;