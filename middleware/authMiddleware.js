import jwt from 'jsonwebtoken';

// Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    console.log('Middleware: No Authorization Header');
    return res.status(401).send({ message: 'Unauthorized access' });
  }
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.error('Middleware: JWT Verification Failed:', err.message);
      return res
        .status(401)
        .send({ message: 'Unauthorized access', error: err.message });
    }
    req.user = decoded;
    next();
  });
};

// Middleware to verify Admin role
export const verifyAdmin = (req, res, next) => {
  const user = req.user; // Assuming verifyToken runs first and populates req.user
  if (user && user.role === 'admin') {
    next();
  } else {
    res.status(403).send({ message: 'Forbidden access' });
  }
};

// Middleware to verify User role
export const verifyUser = (req, res, next) => {
  const user = req.user; // Assuming verifyToken runs first and populates req.user
  if (user && user.role === 'user') {
    next();
  } else {
    res.status(403).send({ message: 'Forbidden access' });
  }
};
