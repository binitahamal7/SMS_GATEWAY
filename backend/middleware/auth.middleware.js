import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "authentication token is required",
      });
    }

    const token = authHeader.split(" ")[1];

    //verify signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //attach authenticated user's ID to the request
    req.user = {
      id:decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "invalid or expired token",
    });
  }
};
