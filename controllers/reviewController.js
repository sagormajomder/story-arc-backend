import { ObjectId } from 'mongodb';
import { collections } from '../config/db.js';

export const getReviews = async (req, res) => {
  try {
    const { bookId } = req.params;
    const reviews = await collections.reviews
      .find({ bookId })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(reviews);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching reviews', error: error.message });
  }
};

export const addReview = async (req, res) => {
  try {
    const { bookId, userEmail, userName, userImage, rating, comment } =
      req.body;

    if (!bookId || !userEmail || !rating || !comment) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newReview = {
      bookId,
      userEmail,
      userName,
      userImage,
      rating: parseInt(rating),
      comment,
      createdAt: new Date().toISOString(),
    };

    const result = await collections.reviews.insertOne(newReview);

    // update book total rating and average rating
    const bookReviews = await collections.reviews.find({ bookId }).toArray();
    const totalRatings = bookReviews.length;
    const sumRatings = bookReviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const averageRating = (sumRatings / totalRatings).toFixed(1);

    await collections.books.updateOne(
      { _id: new ObjectId(bookId) },
      { $set: { rating: parseFloat(averageRating), totalRatings } }
    );

    res
      .status(201)
      .json({
        message: 'Review added successfully',
        reviewId: result.insertedId,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error adding review', error: error.message });
  }
};
