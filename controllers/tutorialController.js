import { ObjectId } from 'mongodb';
import { collections } from '../config/db.js';

// Helper to extract YouTube Video ID
const getYouTubeID = url => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export const getTutorials = async (req, res) => {
  try {
    const { page = 1, limit = 9 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const tutorials = await collections.tutorials
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const totalTutorials = await collections.tutorials.countDocuments();

    res.status(200).json({
      tutorials,
      totalTutorials,
      totalPages: Math.ceil(totalTutorials / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching tutorials', error: error.message });
  }
};

export const createTutorial = async (req, res) => {
  try {
    const { title, url, category } = req.body;

    if (!title || !url || !category) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const videoId = getYouTubeID(url);
    if (!videoId) {
      return res.status(400).json({ message: 'Invalid YouTube URL' });
    }

    const newTutorial = {
      title,
      url,
      videoId,
      category,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      createdAt: new Date().toISOString(),
    };

    const result = await collections.tutorials.insertOne(newTutorial);
    res
      .status(201)
      .json({ message: 'Tutorial created', id: result.insertedId });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error creating tutorial', error: error.message });
  }
};

export const deleteTutorial = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await collections.tutorials.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Tutorial not found' });
    }

    res.status(200).json({ message: 'Tutorial deleted successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error deleting tutorial', error: error.message });
  }
};

export const updateTutorial = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, category } = req.body;

    const updateData = { title, url, category };

    // If URL is changed, update videoId and thumbnail
    if (url) {
      const videoId = getYouTubeID(url);
      if (videoId) {
        updateData.videoId = videoId;
        updateData.thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }

    const result = await collections.tutorials.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Tutorial not found' });
    }

    res.status(200).json({ message: 'Tutorial updated successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error updating tutorial', error: error.message });
  }
};
