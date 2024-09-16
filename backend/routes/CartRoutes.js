import express from 'express';
import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Beer from '../models/Beer.js';
import StockMaterial from '../models/StockMaterial.js';
import Order from '../models/Orders.js';
import User from '../models/User.js';
import { authMiddleware, isAuthenticated } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET carrello dell'utente
router.get('/', authMiddleware, isAuthenticated, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id }).populate('items.beer');
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [], totalPrice: 0 });
            await cart.save();
        }
        res.json(cart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST aggiungi articolo al carrello
router.post('/add', authMiddleware, isAuthenticated, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { beerId, quantity } = req.body;
      const beer = await Beer.findById(beerId).session(session);
      if (!beer) {
        throw new Error('Birra non trovata');
      }
  
      if (beer.quantity < quantity) {
        throw new Error(`Quantità richiesta non disponibile. Disponibili: ${beer.quantity}`);
      }
  
      let cart = await Cart.findOne({ user: req.user._id }).session(session);
      if (!cart) {
        cart = new Cart({ user: req.user._id, items: [], totalPrice: 0 });
      }
  
      const existingItem = cart.items.find(item => item.beer.toString() === beerId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ beer: beerId, quantity });
      }
  
      cart.totalPrice += beer.price * quantity;
      await cart.save({ session });
  
      // Aggiorna la quantità della birra
      beer.quantity -= quantity;
      await beer.save({ session });
  
      await session.commitTransaction();
      res.json(cart);
    } catch (err) {
      console.error('Errore durante l\'aggiunta al carrello:', err);
      await session.abortTransaction();
      res.status(400).json({ message: err.message });
    } finally {
      session.endSession();
    }
  });

// PATCH aggiorna quantità articolo nel carrello
router.patch('/update/:itemId', authMiddleware, isAuthenticated, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { quantity } = req.body;
        const cart = await Cart.findOne({ user: req.user._id }).session(session);
        if (!cart) {
            throw new Error('Carrello non trovato');
        }

        const item = cart.items.id(req.params.itemId);
        if (!item) {
            throw new Error('Articolo non trovato nel carrello');
        }

        const beer = await Beer.findById(item.beer).session(session);
        const stock = await StockMaterial.findOne({ name: beer.name, type: 'bottiglia' }).session(session);
        if (!stock || stock.quantity < quantity) {
            throw new Error('Quantità richiesta non disponibile in magazzino');
        }

        const priceDifference = stock.price * (quantity - item.quantity);
        cart.totalPrice += priceDifference;
        item.quantity = quantity;

        await cart.save({ session });

        await session.commitTransaction();
        res.json(cart);
    } catch (err) {
        await session.abortTransaction();
        res.status(400).json({ message: err.message });
    } finally {
        session.endSession();
    }
});

// DELETE rimuovi articolo dal carrello
router.delete('/remove/:itemId', authMiddleware, isAuthenticated, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const cart = await Cart.findOne({ user: req.user._id }).session(session);
        if (!cart) {
            throw new Error('Carrello non trovato');
        }

        const item = cart.items.id(req.params.itemId);
        if (!item) {
            throw new Error('Articolo non trovato nel carrello');
        }

        const beer = await Beer.findById(item.beer).session(session);
        const stock = await StockMaterial.findOne({ name: beer.name, type: 'bottiglia' }).session(session);
        cart.totalPrice -= stock.price * item.quantity;
        cart.items.pull(req.params.itemId);

        await cart.save({ session });

        await session.commitTransaction();
        res.json(cart);
    } catch (err) {
        await session.abortTransaction();
        res.status(400).json({ message: err.message });
    } finally {
        session.endSession();
    }
});

// POST checkout (crea un ordine dal carrello)
router.post('/checkout', authMiddleware, isAuthenticated, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const cart = await Cart.findOne({ user: req.user._id }).populate('items.beer').session(session);
        if (!cart || cart.items.length === 0) {
            throw new Error('Il carrello è vuoto');
        }

        // Verifica disponibilità in magazzino e calcola il prezzo totale
        let totalPrice = 0;
        for (let item of cart.items) {
            const stock = await StockMaterial.findOne({ name: item.beer.name, type: 'bottiglia' }).session(session);
            if (!stock || stock.quantity < item.quantity) {
                throw new Error(`Quantità insufficiente per ${item.beer.name}`);
            }
            totalPrice += stock.price * item.quantity;
        }

        // Crea l'ordine
        const order = new Order({
            user: req.user._id,
            beers: cart.items.map(item => ({
                beer: item.beer._id,
                quantity: item.quantity,
                price: item.beer.price // Assumiamo che il prezzo sia memorizzato nel modello Beer
            })),
            totalPrice: totalPrice,
            status: 'pending'
        });
        await order.save({ session });

        // Aggiorna il magazzino
        for (let item of cart.items) {
            await StockMaterial.findOneAndUpdate(
                { name: item.beer.name, type: 'bottiglia' },
                { $inc: { quantity: -item.quantity } },
                { session }
            );
        }

        // Aggiorna gli ordini dell'utente
        await User.findByIdAndUpdate(req.user._id, { $push: { orders: order._id } }, { session });

        // Svuota il carrello
        cart.items = [];
        cart.totalPrice = 0;
        await cart.save({ session });

        await session.commitTransaction();
        res.json({ message: 'Ordine creato con successo', order });
    } catch (err) {
        await session.abortTransaction();
        res.status(400).json({ message: err.message });
    } finally {
        session.endSession();
    }
});

export default router;