import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
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

    // Generate JWT Token
    const token = jwt.sign(
      { email: user.email, role: user.role, id: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );

    // Return user info and token
    res.status(200).json({ ...userWithoutPassword, token });
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

      // Generate JWT Token
      const token = jwt.sign(
        {
          email: createdUser.email,
          role: createdUser.role,
          id: createdUser._id,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' }
      );

      return res.status(200).json({ ...createdUser, token });
    }

    // Return existing user with token
    // Generate JWT Token
    const token = jwt.sign(
      { email: user.email, role: user.role, id: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );
    // console.log(user);
    res.status(200).json({ ...user, token });
  } catch (error) {
    console.error('Error processing social login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Fetch users with pagination
    const users = await collections.users
      .find({})
      .project({ password: 0 }) // Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const totalUsers = await collections.users.countDocuments();
    const adminCount = await collections.users.countDocuments({
      role: 'admin',
    });

    res.status(200).json({
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limitNum),
      currentPage: pageNum,
      stats: {
        activeUsers: totalUsers, // Assuming all users are "active" for now
        adminRoles: adminCount,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res
      .status(500)
      .json({ message: 'Error fetching users', error: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const result = await collections.users.updateOne(
      { _id: new ObjectId(id) },
      { $set: { role } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res
      .status(500)
      .json({ message: 'Error updating user role', error: error.message });
  }
  res
    .status(500)
    .json({ message: 'Error updating user role', error: error.message });
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await collections.users.findOne({ _id: new ObjectId(id) });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res
      .status(500)
      .json({ message: 'Error fetching user', error: error.message });
  }
};

export const addToShelf = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookId, status = 'Want to Read' } = req.body;

    if (!bookId) {
      return res.status(400).json({ message: 'Book ID is required' });
    }

    const user = await collections.users.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if book is already in shelf
    const shelf = user.shelf || [];
    const isAlreadyInShelf = shelf.some(item => item.bookId === bookId);

    if (isAlreadyInShelf) {
      await collections.users.updateOne(
        { _id: new ObjectId(id), 'shelf.bookId': bookId },
        {
          $set: {
            'shelf.$.status': status,
          },
        }
      );
      return res.status(200).json({ message: 'Book status updated' });
    }

    // Add new item
    const newItem = {
      bookId,
      status,
      progress: 0,
      startedAt:
        status === 'Currently Reading' ? new Date().toISOString() : null,
      addedAt: new Date().toISOString(),
    };

    const result = await collections.users.updateOne(
      { _id: new ObjectId(id) },
      { $push: { shelf: newItem } }
    );

    res.status(200).json({ message: 'Book added to shelf successfully' });
  } catch (error) {
    console.error('Error adding to shelf:', error);
    res
      .status(500)
      .json({ message: 'Error adding to shelf', error: error.message });
  }
};

export const updateShelfProgress = async (req, res) => {
  try {
    const { id, bookId } = req.params;
    const { progress, totalPages, status } = req.body;
    // progress is pages read

    const user = await collections.users.findOne({ _id: new ObjectId(id) });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // We need to find the specific item index or match it
    // Using positional operator $

    // Determine new status if auto-completing
    let newStatus = status;
    let finishedAt = null;

    if (progress >= totalPages && totalPages > 0) {
      newStatus = 'Read';
      finishedAt = new Date().toISOString();
    }

    const updateFields = {
      'shelf.$.progress': parseInt(progress),
    };

    if (newStatus) updateFields['shelf.$.status'] = newStatus;
    if (finishedAt) updateFields['shelf.$.finishedAt'] = finishedAt;
    if (totalPages) updateFields['shelf.$.totalPages'] = parseInt(totalPages);

    const result = await collections.users.updateOne(
      { _id: new ObjectId(id), 'shelf.bookId': bookId },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Book not found in shelf' });
    }

    res.status(200).json({ message: 'Progress updated', status: newStatus });
  } catch (error) {
    console.error('Error updating progress:', error);
    res
      .status(500)
      .json({ message: 'Error updating progress', error: error.message });
  }
};
export const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await collections.users.findOne({ _id: new ObjectId(id) });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const shelf = user.shelf || [];
    const readBooks = shelf.filter(
      item =>
        item.status === 'Read' || (typeof item === 'string' ? false : false)
    );

    // Books Read This Year
    const currentYear = new Date().getFullYear();
    const booksReadThisYear = readBooks.filter(item => {
      const finishedDate = item.finishedAt ? new Date(item.finishedAt) : null;
      return finishedDate && finishedDate.getFullYear() === currentYear;
    }).length;

    // Total Pages Read (Accumulate progress)
    const totalPagesRead = shelf.reduce(
      (acc, item) => acc + (item.progress || 0),
      0
    );

    // Total Finish Books
    const totalBooksRead = readBooks.length;

    // Streak (Mock or Simple logic)
    const streak = user.streak || 0;

    // Average Rating Calculation
    const userReviews = await collections.reviews
      .find({ userEmail: user.email })
      .toArray();
    const totalUserRatings = userReviews.length;
    const sumUserRatings = userReviews.reduce(
      (acc, review) => acc + (review.rating || 0),
      0
    );
    const averageRating =
      totalUserRatings > 0 ? (sumUserRatings / totalUserRatings).toFixed(1) : 0;

    // Goal
    const goal = user.readingGoal || {
      year: currentYear,
      target: 20,
      current: booksReadThisYear,
    };
    // Ensure accurate current count
    goal.current = booksReadThisYear;

    res.status(200).json({
      stats: {
        booksReadThisYear,
        totalPagesRead,
        totalBooksRead,
        streak,
        averageRating,
        totalUserRatings,
      },
      goal,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

export const updateReadingGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { target } = req.body;
    const currentYear = new Date().getFullYear();

    await collections.users.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          'readingGoal.target': parseInt(target),
          'readingGoal.year': currentYear,
        },
      }
    );
    res.status(200).json({ message: 'Goal updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating goal' });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await collections.users.findOne({ _id: new ObjectId(id) });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const shelf = user.shelf || [];
    const shelvedBookIds = shelf.map(item =>
      typeof item === 'string' ? new ObjectId(item) : new ObjectId(item.bookId)
    );

    // 1. Get User Genres from Read books
    // We need to fetch the books in the shelf to know their genres
    // Ideally we optimize this with an aggregation

    // Aggregation:
    // Match User -> Unwind Shelf -> Lookup Books -> Group by Genre -> Sort Count

    // Simplification for MVP:
    // Just fetch highly rated books that are NOT in user's shelf.
    // If we have time: prioritize genres.

    const recommendations = await collections.books
      .aggregate([
        { $match: { _id: { $nin: shelvedBookIds } } }, // Exclude moved books
        { $sort: { rating: -1, reviewCount: -1 } }, // Top rated
        { $limit: 15 },
      ])
      .toArray();

    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ message: 'Error fetching recommendations' });
  }
};
