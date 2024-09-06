import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    beer: { type: mongoose.Schema.Types.ObjectId, ref: 'Beer', required: true },
    content: { type: String, required: true },
    replies: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true,
    collection: 'Comments'
});

export default mongoose.model('Comment', commentSchema);