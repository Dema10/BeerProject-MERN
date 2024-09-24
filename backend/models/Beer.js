import mongoose from "mongoose";

const beerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    style: { type: String, required: true },
    abv: { type: Number, required: true },
    description: { type: String, required: true },
    img: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    inProduction: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    quantity: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true },
    minimumStock: { type: Number, required: true },
}, {
    timestamps: true,
    collection: 'Beers'
});

// Metodo virtuale per verificare se la birra è ancora "nuova"
beerSchema.virtual('isNew').get(function() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return this.createdAt > sevenDaysAgo;
});

// Assicuriamoci che il campo virtuale sia incluso quando convertiamo in JSON
beerSchema.set('toJSON', { virtuals: true });
beerSchema.set('toObject', { virtuals: true });

export default mongoose.model('Beer', beerSchema);