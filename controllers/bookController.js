import { ObjectId } from 'mongodb';
import { collections } from '../config/db.js';

export const getBooks = async (req, res) => {
  try {
    const { genre } = req.query;
    const query = {};

    if (genre && genre !== 'All Genres') {
      query.genre = genre;
    }

    const books = await collections.books.find(query).toArray();
    res.status(200).json(books);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching books', error: error.message });
  }
};

export const getGenres = async (req, res) => {
  try {
    const genres = await collections.books.distinct('genre');
    res.status(200).json(genres);
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
