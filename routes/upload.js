const express = require('express');
const uploadRouter = express.Router();
const cloudinary = require('../configs/cloudinary');
const auth = require('../middlewares/auth');

// Upload single image
uploadRouter.post('/single', auth, async (req, res) => {
	try {
		const { image, folder } = req.body;
		const result = await cloudinary.uploader.upload(image, {
			folder: folder || 'eshop',
			resource_type: 'auto',
		});
		res.json(result);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Upload multiple images
uploadRouter.post('/multiple', auth, async (req, res) => {
	try {
		const { images, folder } = req.body;
		const uploadPromises = images.map(image =>
			cloudinary.uploader.upload(image, {
				folder: folder || 'eshop',
				resource_type: 'auto',
			}),
		);
		const results = await Promise.all(uploadPromises);
		res.json(results);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Delete image
uploadRouter.delete('/:publicId', auth, async (req, res) => {
	try {
		const { publicId } = req.params;
		const result = await cloudinary.uploader.destroy(publicId);
		res.json(result);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// Delete profile picture
uploadRouter.delete('/profile-picture/:imageUrl', auth, async (req, res) => {
	try {
		const { imageUrl } = req.params;
		const uri = new URL(imageUrl);
		const pathSegments = uri.pathname.split('/');

		// Find the index of 'eshop' in the path
		const eshopIndex = pathSegments.findIndex(segment => segment === 'eshop');

		if (eshopIndex !== -1) {
			// Construct the public ID
			const publicId = pathSegments.slice(eshopIndex).join('/');
			// Remove the file extension
			const publicIdWithoutExtension = publicId.substring(
				0,
				publicId.lastIndexOf('.'),
			);

			const result = await cloudinary.uploader.destroy(
				publicIdWithoutExtension,
			);
			res.json(result);
		} else {
			throw new Error('Invalid image URL format');
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

module.exports = uploadRouter;
