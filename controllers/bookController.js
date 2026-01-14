import { ObjectId } from 'mongodb';
import { collections } from '../config/db.js';

export const getBooks = async (req, res) => {
  try {
    const {
      search,
      genre,
      minRating,
      maxRating,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Search (Title or Author)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    // Genre Filter (Multi-select support: "Sci-Fi,Fantasy")
    if (genre && genre !== 'All Genres') {
      const genres = genre.split(',').map(g => g.trim());
      if (genres.includes('Uncategorized')) {
        query.$or = [
          ...(query.$or || []),
          { genre: { $in: genres.filter(g => g !== 'Uncategorized') } },
          { genre: { $in: [null, ''] } },
          { genre: { $exists: false } },
        ];
        // Clean up empty $or if no other genres
        if (
          query.$or.length === 1 &&
          query.$or[0].genre &&
          query.$or[0].genre.$in.length === 0
        ) {
          // Only Uncategorized logic remains, but we mixed it with search $or...
          // If search exists, we need $and.
          // Let's Simplify: complex combinations of ORs for search AND genre are tricky.
          // Re-structuring:
          // $and: [ { $or: search }, { $or: genre } ]
        }
      } else {
        query.genre = { $in: genres };
      }
    }

    // Re-building Query to safely handle Search + Genre complexity
    const finalQuery = {};
    if (search) {
      finalQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    if (genre && genre !== 'All Genres') {
      const genres = genre.split(',').map(g => g.trim());
      const genreQuery = [];

      const realGenres = genres.filter(g => g !== 'Uncategorized');
      if (realGenres.length > 0) {
        genreQuery.push({ genre: { $in: realGenres } });
      }

      if (genres.includes('Uncategorized')) {
        genreQuery.push({ genre: { $in: [null, ''] } });
        genreQuery.push({ genre: { $exists: false } });
      }

      if (genreQuery.length > 0) {
        // If we have search $or, we must use $and for genre
        if (finalQuery.$or) {
          finalQuery.$and = [{ $or: genreQuery }];
        } else {
          finalQuery.$or = genreQuery;
        }
      }
    }

    // Rating Filter
    if (minRating || maxRating) {
      finalQuery.rating = {};
      if (minRating) finalQuery.rating.$gte = parseFloat(minRating);
      if (maxRating) finalQuery.rating.$lte = parseFloat(maxRating);
    }

    // Sorting
    let sortOptions = { createdAt: -1 }; // Default: Newest
    if (sort === 'rating_desc') {
      sortOptions = { rating: -1 };
    } else if (sort === 'shelved_desc') {
      sortOptions = { shelvedCount: -1 };
    } else if (sort === 'title_asc') {
      sortOptions = { title: 1 };
    } else if (sort === 'title_desc') {
      sortOptions = { title: -1 };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const books = await collections.books
      .find(finalQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const totalBooks = await collections.books.countDocuments(finalQuery);

    res.status(200).json({
      books,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching books', error: error.message });
  }
};

export const getGenres = async (req, res) => {
  try {
    const genres = await collections.books
      .aggregate([
        { $group: { _id: '$genre' } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, genre: '$_id' } },
      ])
      .toArray();

    const genreStrings = genres.map(g => g.genre).filter(g => g && g !== ''); // Filter out null or empty strings

    // Check if there are any books with empty or null genre
    const hasUncategorized = genres.some(g => !g.genre || g.genre === '');

    if (hasUncategorized) {
      genreStrings.push('Uncategorized');
    }

    // Sort again to ensure Uncategorized is at the end or alphabetized as preferred.
    // Usually Uncategorized is good at the end or beginning.
    // Let's keep it appended or sort it.
    // Let's just return it as is, usually specific genres are sorted.

    res.status(200).json(genreStrings);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching genres', error: error.message });
  }
};

export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await collections.books.findOne({ _id: new ObjectId(id) });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json(book);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching book', error: error.message });
  }
};

export const createBook = async (req, res) => {
  try {
    const newBook = req.body;
    newBook.createdAt = new Date().toISOString();
    const result = await collections.books.insertOne(newBook);
    res.status(201).json({
      message: 'Book created successfully',
      bookId: result.insertedId,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error creating book', error: error.message });
  }
};

export const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBook = req.body;
    delete updatedBook._id; // Ensure _id is not updated

    const result = await collections.books.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedBook }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json({ message: 'Book updated successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error updating book', error: error.message });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await collections.books.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error deleting book', error: error.message });
  }
};
