import express from 'express';
import Order from '../models/Orders.js';
import User from '../models/User.js';
import { authMiddleware, isAdmin, isAuthenticated } from '../middlewares/authMiddleware.js';

const router = express.Router();

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
        const orders = await Order.find({ user: req.user._id })
            .populate('beers.beer', 'name price');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new order
router.post('/', authMiddleware, isAuthenticated, async (req, res) => {
    try {
        const order = new Order({
            user: req.user._id,
            beers: req.body.beers,
            totalPrice: req.body.totalPrice
        });
        const newOrder = await order.save();

        // Update user's orders
        await User.findByIdAndUpdate(req.user._id, { $push: { orders: newOrder._id } });

        res.status(201).json(newOrder);
    } catch (err) {
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