import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    beers: [{
        beer: { type: mongoose.Schema.Types.ObjectId, ref: 'Beer', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered'], default: 'pending' }
}, {
    timestamps: true,
    collection: 'Orders'
});

export default mongoose.model('Order', orderSchema);