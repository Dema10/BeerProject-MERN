import axios from "axios";

const API_URL = "http://localhost:3002";
const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
            console.log("Token inviato", token);
        }
        return config;
    },
    (err) => {
        return Promise.reject(err);
    }
);

// Auth
export const loginUser = async (credentials) => {
    try {
        // richiesta di login
        const res = await api.post('/auth/login', credentials);
        // log per debugging
        console.log('Risposta api login', res.data);
        //  restituisco i dati della risposta
        return res.data;
    } catch (err) {
        console.error("Errore nella chiama del login", err);
        throw err;
    }
};

export const getMe = () => api.get('/auth/me').then(res => res.data);

export const getUserData = async () => {
    try {
        // richiesta per ottenere i dati dell' utente
        const res = await api.get('/auth/me');
        // restituisce i dati dell' utente
        return res.data;
    } catch (err) {
        console.error('Errore nel recupero dei dati dell\' autore', err);
        throw err;
    }
};

// Users
export const getAllUsers = (params) => api.get('/users', { params });

export const registerUser = (userData) => api.post('/users', userData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});

export const updateUserProfile = (userData) => api.patch('/users/profile', userData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});

export const deleteUserAccount = (userId) => api.delete(`/users/${userId}`);

export const getUserLikedBeers = () => api.get('/users/liked-beers');
export const likeBeer = (beerId) => api.post(`/users/like-beer/${beerId}`);
export const unlikeBeer = (beerId) => api.delete(`/users/unlike-beer/${beerId}`);

// Beers
export const getBeers = () => api.get('/beers');
export const getBeer = (id) => api.get(`/beers/${id}`);
export const createBeer = (beerData) => api.post('/beers', beerData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});
export const updateBeer = (id, beerData) => api.patch(`/beers/${id}`, beerData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});
export const deleteBeer = (id) => api.delete(`/beers/${id}`);

// Comments
export const getComments = async (beerId) => {
    try {
      const response = await api.get(`/comments/beer/${beerId}`);
      console.log('Risposta completa dei commenti:', response);
      return response.data;
    } catch (error) {
      console.error('Errore nel recupero dei commenti:', error);
      throw error;
    }
  };
export const addComment = (commentData) => api.post('/comments', commentData);
export const updateComment = (commentId, commentData) => api.patch(`/comments/${commentId}`, commentData);
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`);
export const addReplyToComment = (commentId, replyData) => api.post(`/comments/${commentId}/reply`, replyData);

// Orders
export const getOrders = () => api.get('/orders');
export const getUserOrders = () => api.get('/orders/myorders');
export const createOrder = (orderData) => api.post('/orders', orderData);
export const updateOrderStatus = (orderId, status) => api.patch(`/orders/${orderId}/status`, { status });
export const deleteOrder = (orderId) => api.delete(`/orders/${orderId}`);

// Production
export const getProductions = () => api.get('/productions');
export const getProduction = (id) => api.get(`/productions/${id}`);
export const createProduction = (productionData) => api.post('/productions', productionData);
export const updateProduction = (id, productionData) => api.patch(`/productions/${id}`, productionData);
export const deleteProduction = (id) => api.delete(`/productions/${id}`);

// Recipes
export const getRecipes = () => api.get('/recipes');
export const getRecipe = (id) => api.get(`/recipes/${id}`);
export const createRecipe = (recipeData) => api.post('/recipes', recipeData);
export const updateRecipe = (id, recipeData) => api.patch(`/recipes/${id}`, recipeData);
export const deleteRecipe = (id) => api.delete(`/recipes/${id}`);
export const getRecipesForBeer = (beerId) => api.get(`/recipes/beer/${beerId}`);
export const associateRecipeToBeer = (recipeId, beerId) => api.post(`/recipes/${recipeId}/associate-beer/${beerId}`);

// Stock Materials
export const getStockMaterials = () => api.get('/stock-materials');
export const getStockMaterial = (id) => api.get(`/stock-materials/${id}`);
export const createStockMaterial = (materialData) => api.post('/stock-materials', materialData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});
export const updateStockMaterial = (id, materialData) => api.patch(`/stock-materials/${id}`, materialData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});
export const deleteStockMaterial = (id) => api.delete(`/stock-materials/${id}`);

// Cart
export const getCart = () => api.get('/cart');
export const addToCart = (data) => api.post('/cart/add', data);
export const updateCartItem = (itemId, data) => api.patch(`/cart/update/${itemId}`, data);
export const removeFromCart = (itemId) => api.delete(`/cart/remove/${itemId}`);
export const checkout = () => api.post('/cart/checkout');

// Carousel Images
export const getCarouselImages = () => api.get('/carousel-images');
export const createCarouselImage = (imageData) => api.post('/carousel-images', imageData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});
export const updateCarouselImage = (id, imageData) => api.patch(`/carousel-images/${id}`, imageData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});
export const deleteCarouselImage = (id) => api.delete(`/carousel-images/${id}`);

export default api;