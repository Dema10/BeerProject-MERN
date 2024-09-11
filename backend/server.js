import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import listEndpoints from 'express-list-endpoints';
import UserRoutes from './routes/UserRoutes.js';
import BeerRoutes from './routes/BeerRoutes.js';
import CommentsRoutes from './routes/CommentsRoutes.js';
import ProductionRoutes from './routes/ProductionRoutes.js';
import RecipeRoutes from './routes/RecipeRoutes.js';
import StockMaterialRoutes from './routes/StockMaterialRoutes.js';
import OrdersRoutes from './routes/OrdersRoutes.js';
import CartRoutes from './routes/CartRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { badRequestHandler, authorizedHandler, notFoundHandler, genericErrorHandler } from './middlewares/errorHandlers.js';

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MONGODB CONNESSO CORRETTAMENTE'))
    .catch((err) => console.error('ERRORE', err))

app.use('/auth', authRoutes);
app.use('/users', UserRoutes);
app.use('/beers', BeerRoutes);
app.use('/orders', OrdersRoutes);
app.use('/cart', CartRoutes);
app.use('/productions', ProductionRoutes);
app.use('/recipes', RecipeRoutes);
app.use('/stock-materials', StockMaterialRoutes);
app.use('/comments', CommentsRoutes);

const PORT = process.env.PORT || 3003;

app.use(badRequestHandler);
app.use(authorizedHandler);
app.use(notFoundHandler);
app.use(genericErrorHandler);

app.listen(PORT, () => {
    console.log('SIAMO IN ASCOLTO SULLA PORTA ' + PORT)
    console.table(listEndpoints(app));
});