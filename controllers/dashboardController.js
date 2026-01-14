import { collections } from '../config/db.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalBooks = await collections.books.countDocuments();
    const totalUsers = await collections.users.countDocuments({ role: 'user' });
    const pendingReviews = await collections.reviews.countDocuments({
      status: 'pending',
    });

    res.status(200).json({
      totalBooks,
      totalUsers,
      pendingReviews,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching stats', error: error.message });
  }
};

export const getDashboardCharts = async (req, res) => {
  try {
    const genreData = await collections.books
      .aggregate([
        {
          $group: {
            _id: '$genre',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            name: '$_id',
            value: '$count',
            _id: 0,
          },
        },
      ])
      .toArray();

    res.status(200).json({ genreData });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching chart data', error: error.message });
  }
};
