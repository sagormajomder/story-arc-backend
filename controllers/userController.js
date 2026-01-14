import bcrypt from 'bcryptjs';
import { collections } from '../config/db.js';

export const registerUser = async (req, res) => {
  try {
    const userInfo = req.body;

    const email = userInfo.email;
    const userExist = await collections.users.findOne({ email });

    if (userExist) {
      return res.status(400).json({ message: 'User already exists' });
    }

    //  create user
    const hashPassword = await bcrypt.hash(userInfo.password, 10);
    const newUser = {
      ...userInfo,
      createdAt: new Date().toISOString(),
      role: 'user',
      password: hashPassword,
    };

    const result = await collections.users.insertOne(newUser);
    // console.log(result);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await collections.users.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = user;

    // Return user info
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { email, name, image } = req.body;

    const user = await collections.users.findOne({ email });

    if (!user) {
      const newUser = {
        name,
        email,
        image,
        role: 'user',
        provider: 'google',
        createdAt: new Date().toISOString(),
      };

      const result = await collections.users.insertOne(newUser);

      // Fetch the created user to return it
      const createdUser = await collections.users.findOne({
        _id: result.insertedId,
      });
      return res.status(200).json(createdUser);
    }

    // Return existing user
    // console.log(user);
    res.status(200).json(user);
  } catch (error) {
    console.error('Error processing social login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
