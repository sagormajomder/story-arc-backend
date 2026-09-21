import { ObjectId } from 'mongodb';
import { collections } from '../config/db.js';

export const getGenres = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Fetch genres with pagination
    const genres = await collections.genres
      .find({})
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Get count for each genre
    const genresWithCount = await Promise.all(
      genres.map(async genre => {
        const count = await collections.books.countDocuments({
          genre: genre.name,
        });
        return { ...genre, bookCount: count };
      })
    );

    const totalGenres = await collections.genres.countDocuments();

    res.status(200).json({
      genres: genresWithCount,
      totalGenres,
      totalPages: Math.ceil(totalGenres / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching genres', error: error.message });
  }
};

export const createGenre = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Genre name is required' });
    }

    const existingGenre = await collections.genres.findOne({ name });
    if (existingGenre) {
      return res.status(400).json({ message: 'Genre already exists' });
    }

    const result = await collections.genres.insertOne({ name });
    res.status(201).json({ message: 'Genre created', id: result.insertedId });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error creating genre', error: error.message });
  }
};

export const updateGenre = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Genre name is required' });
    }

    // 1. Find the existing genre to get the old name
    const existingGenre = await collections.genres.findOne({
      _id: new ObjectId(id),
    });

    if (!existingGenre) {
      return res.status(404).json({ message: 'Genre not found' });
    }

    const oldName = existingGenre.name;

    // 2. Update the genre name in the genres collection
    const newName = name.trim();
    await collections.genres.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name: newName } }
    );

    // 3. Update all books that have this genre
    if (oldName !== newName) {
      console.log(`Renaming genre in books from "${oldName}" to "${newName}"`);
      const updateResult = await collections.books.updateMany(
        { genre: oldName },
        { $set: { genre: newName } }
      );
      console.log(`Updated ${updateResult.modifiedCount} books.`);
    }

    res.status(200).json({ message: 'Genre updated successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error updating genre', error: error.message });
  }
};

export const deleteGenre = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the genre to get its name before deleting
    const existingGenre = await collections.genres.findOne({
      _id: new ObjectId(id),
    });

    if (!existingGenre) {
      return res.status(404).json({ message: 'Genre not found' });
    }

    const genreName = existingGenre.name;

    // 2. Delete the genre
    const result = await collections.genres.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Genre not found' });
    }

    // 3. Update associated books to have empty genre
    await collections.books.updateMany(
      { genre: genreName },
      { $set: { genre: '' } }
    );

    res.status(200).json({ message: 'Genre deleted successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error deleting genre', error: error.message });
  }
};
