import mongoose from "mongoose";

const stockMaterialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    price: { type: Number, required: true },
    minimumStock: { type: Number, required: true },
    supplier: { type: String },
    img: { type: String },
    details: { type: Object }
}, {
    timestamps: true,
    collection: 'StockMaterials'
});

export default mongoose.model('StockMaterial', stockMaterialSchema);