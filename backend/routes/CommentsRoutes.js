import express from 'express';
import Comment from '../models/Comments.js';
import Beer from '../models/Beer.js';
import { authMiddleware, isAdmin, isAuthenticated } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET comments for a specific beer
router.get('/beer/:beerId', async (req, res) => {
    try {
        const comments = await Comment.find({ beer: req.params.beerId })
            .populate('user', 'name avatar')
            .populate('replies.user', 'name avatar');
        res.json(comments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new comment
router.post('/', authMiddleware, isAuthenticated, async (req, res) => {
    try {
        const comment = new Comment({
            user: req.user._id,
            beer: req.body.beerId,
            content: req.body.content
        });
        const newComment = await comment.save();

        // Add comment to the beer
        await Beer.findByIdAndUpdate(req.body.beerId, { $push: { comments: newComment._id } });

        res.status(201).json(newComment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE a comment
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ message: 'Commento non trovato' });

        if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorizzato a modificare questo commento' });
        }

        const updatedComment = await Comment.findByIdAndUpdate(
            req.params.id,
            { content: req.body.content },
            { new: true }
        );
        res.json(updatedComment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE a comment
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ message: 'Commento non trovato' });

        if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorizzato a eliminare questo commento' });
        }

        // Remove comment from the beer
        await Beer.findByIdAndUpdate(comment.beer, { $pull: { comments: comment._id } });

        await Comment.findByIdAndDelete(req.params.id);
        res.json({ message: "Commento eliminato" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a reply to a comment (admin only)
router.post('/:id/reply', authMiddleware, isAdmin, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ message: 'Commento non trovato' });

        comment.replies.push({
            user: req.user._id,
            content: req.body.content
        });

        await comment.save();
        res.status(201).json(comment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;