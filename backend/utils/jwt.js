import jwt from "jsonwebtoken";

// funzione per creare un token JWT
export const generateJWT = (payload) => {
    return new Promise((resolve, reject) =>
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: "1 day" },
            (err, token) => {
                if (err) reject(err);
                else resolve(token);
            }
        )
    );
};

// funzione per verificare un token JWT
export const verifyJWT = (token) => {
    return new Promise((resolve, reject) => 
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) reject(err);
            else resolve(decoded)
        })
    );
};