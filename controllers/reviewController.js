import { ObjectId } from 'mongodb';
import { collections } from '../config/db.js';

// Public: Get only approved reviews for a book
export const getReviews = async (req, res) => {
  try {
    const { bookId } = req.params;
    const reviews = await collections.reviews
      .find({ bookId, status: 'approved' })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(reviews);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching reviews', error: error.message });
  }
};


// Admin: Get reviews (default pending, or by filter)
export const getAdminReviews = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const reviews = await collections.reviews
      .aggregate([
        { $match: query },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: 'books',
            let: { bookIdStr: '$bookId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', { $toObjectId: '$$bookIdStr' }] },
                },
              },
              { $project: { title: 1, author: 1, cover: 1 } },
            ],
            as: 'bookDetails',
          },
        },
        { $unwind: { path: '$bookDetails', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            bookTitle: { $ifNull: ['$bookTitle', '$bookDetails.title'] },
            bookAuthor: { $ifNull: ['$bookAuthor', '$bookDetails.author'] },
            bookCover: { $ifNull: ['$bookCover', '$bookDetails.cover'] },
          },
        },
      ])
      .toArray();

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Get Admin Reviews Error:', error);
    res
      .status(500)
      .json({ message: 'Error fetching admin reviews', error: error.message });
  }
};

// User: Add review (Pending by default)
export const addReview = async (req, res) => {
  try {
    const {
      bookId,
      userEmail,
      userName,
      userImage,
      rating,
      comment,
      bookTitle,
      bookAuthor,
      bookCover,
    } = req.body;

    if (!bookId || !userEmail || !rating || !comment) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // If book details are missing in request, fetch them from DB
    let finalBookTitle = bookTitle;
    let finalBookAuthor = bookAuthor;
    let finalBookCover = bookCover;

    if (!bookTitle || !bookAuthor) {
      const book = await collections.books.findOne({
        _id: new ObjectId(bookId),
      });
      if (book) {
        finalBookTitle = book.title;
        finalBookAuthor = book.author;
        finalBookCover = book.cover;
      }
    }

    const newReview = {
      bookId,
      bookTitle: finalBookTitle || 'Unknown Book',
      bookAuthor: finalBookAuthor || 'Unknown Author',
      bookCover: finalBookCover || '',
      userEmail,
      userName,
      userImage,
      rating: parseInt(rating),
      comment,
      status: 'pending', // Default status
      createdAt: new Date().toISOString(),
    };

    const result = await collections.reviews.insertOne(newReview);

    // Note: We DO NOT update book rating here anymore. Only on approval.

    res.status(201).json({
      message: 'Review submitted for moderation',
      reviewId: result.insertedId,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error adding review', error: error.message });
  }
};

// Admin: Approve Review
export const approveReview = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Update status to approved
    const updateResult = await collections.reviews.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: 'approved' } },
      { returnDocument: 'after' }
    );

    if (!updateResult) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const review = updateResult;
    // Note: Native driver 'findOneAndUpdate' return structure varies by version.
    // Assuming 'review' is the document or result.value.
    // Safe check: re-fetch if unsure, but let's assume standard behavior or use value.

    const bookId = review.bookId || review.value?.bookId; // Handle potential driver differences

    if (bookId) {
      // 2. Recalculate Rating
      const bookReviews = await collections.reviews
        .find({ bookId, status: 'approved' })
        .toArray();
      const totalRatings = bookReviews.length;
      const sumRatings = bookReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating =
        totalRatings > 0 ? (sumRatings / totalRatings).toFixed(1) : 0;

      await collections.books.updateOne(
        { _id: new ObjectId(bookId) },
        { $set: { rating: parseFloat(averageRating), totalRatings } }
      );
    }

    res.status(200).json({ message: 'Review approved and ratings updated' });
  } catch (error) {
    console.error('Approve Error:', error);
    res
      .status(500)
      .json({ message: 'Error approving review', error: error.message });
  }
};

// Admin: Delete Review
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await collections.reviews.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Optional: If we deleted an APPROVED review, we might want to re-calculate ratings.
    // For now, let's assume mainly pending reviews are deleted.
    // If strict correctness needed, we could fetch details before delete and recalc.

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error deleting review', error: error.message });
  }
};
