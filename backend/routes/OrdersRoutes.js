import express from 'express';
import Order from '../models/Orders.js';
import User from '../models/User.js';
import { authMiddleware, isAdmin, isAuthenticated } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Funzione di utilità per verificare la disponibilità e calcolare il prezzo totale
const validateOrderAndCalculateTotal = async (beers) => {
    let total = 0;
    for (let item of beers) {
        const beer = await Beer.findById(item.beer);
        if (!beer) throw new Error(`Birra con id ${item.beer} non trovata`);

        // Trova lo stock della birra (assumiamo che il nome dello stock corrisponda al nome della birra)
        const stock = await StockMaterial.findOne({ name: beer.name, type: 'bottiglia' });
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
        const { page = 1, limit = 10 } = req.query;
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('beers.beer', 'name price')
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Order.countDocuments();

        res.json({
            orders,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalOrders: count
        });
    } catch (err) {
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
                const stock = await StockMaterial.findOne({ name: beer.name, type: 'bottiglia' });
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
                { name: beer.name, type: 'bottiglia' },
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
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        res.json(updatedOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE an order (admin only)
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Ordine non trovato' });

        await User.findByIdAndUpdate(order.user, { $pull: { orders: order._id } });
        await Order.findByIdAndDelete(req.params.id);

        res.json({ message: "Ordine eliminato" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;