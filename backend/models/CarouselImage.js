import mongoose from "mongoose";

const carouselImageSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true,
    collection: 'CarouselImages'
});

export default mongoose.model('CarouselImage', carouselImageSchema);