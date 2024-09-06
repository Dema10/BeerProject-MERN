import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "https://example.com/default-avatar.jpg" },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    likedBeers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Beer' }],
    deletedAt: { type: Date, default: null }
},
{
    timestamps: true,
    collection: 'Users'
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.softDelete = function() {
    this.deletedAt = new Date();
    return this.save();
  };

export default mongoose.model('User', userSchema);