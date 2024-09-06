import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    style: { type: String, required: true },
    og: { type: Number, required: true },
    fg: { type: Number, required: true },
    ibu: { type: Number, required: true },
    ebc: { type: Number, required: true },
    abv: { type: Number, required: true },
    volume: { type: Number, required: true },
    ingredients: [{
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true }
    }],
    instructions: { type: String, required: true },
    associatedBeer: { type: mongoose.Schema.Types.ObjectId, ref: 'Beer' }
}, {
    timestamps: true,
    collection: 'Recipes'
});

export default mongoose.model('Recipe', recipeSchema);