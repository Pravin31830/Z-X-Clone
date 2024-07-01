import jwt from 'jsonwebtoken';
import User from '../models/user.model.js'; // Adjust the path as per your project structure

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "You need to login first" });
        }

        console.log("Token received: ", token); // Log token for debugging

        const decoded = jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error("JWT verification error: ", err);
                return res.status(401).json({ error: "Invalid Token" });
            }
            return decoded;
        });

        console.log("Token decoded: ", decoded); // Log decoded token for debugging

        const user = await User.findById(decoded.userID).select("-password");

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        req.user = user; // Set the user object to req.user for use in subsequent middleware/controllers
        next();
    } catch (err) {
        console.log("Error in ProtectRoute Middleware", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};
