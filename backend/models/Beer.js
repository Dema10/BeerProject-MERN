import mongoose from "mongoose";

const beerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    style: { type: String, required: true },
    abv: { type: Number, required: true },
    description: { type: String, required: true },
    image: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    inProduction: { type: Boolean, default: true }
}, {
    timestamps: true,
    collection: 'Beers'
});

export default mongoose.model('Beer', beerSchema);