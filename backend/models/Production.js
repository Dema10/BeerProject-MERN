import mongoose from "mongoose";

const productionSchema = new mongoose.Schema({
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    quantity: { type: Number, required: true },
    status: { type: String, enum: ['planned', 'in-progress', 'completed'], default: 'planned' },
    notes: { type: String }
}, {
    timestamps: true,
    collection: 'Productions'
});

export default mongoose.model('Production', productionSchema);