import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        beer: { type: mongoose.Schema.Types.ObjectId, ref: 'Beer', required: true },
        quantity: { type: Number, required: true, min: 1 }
    }],
    totalPrice: { type: Number, required: true, default: 0 }
}, {
    timestamps: true
});

export default mongoose.model('Cart', cartSchema);