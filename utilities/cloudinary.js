const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dt5xftbzd', 
  api_key: process.env.CLOUDINARY_API_KEY || '994333695352177', 
  api_secret: process.env.CLOUDINARY_API_SECRET || 'TmEZopqaPB2aOylB_xV_oPvO4tM'// Store this in your .env file
});

// Set up Multer storage (temporary folder)
const upload = multer({ dest: 'uploads/' });

/**
* Upload file to Cloudinary
* @param {string} filePath - Path of the uploaded file
* @returns {Promise<string>} - Cloudinary URL
*/
const uploadToCloudinary = async (filePath) => {
  try {
      const result = await cloudinary.uploader.upload(filePath, { 
        folder: "products",
        fetch_format: "auto",  // Auto-adjust format
        quality: "auto",       // Auto-adjust quality
        crop: "auto",          // Auto-crop
        gravity: "auto",
        width: 500,
        height: 500
       });
      fs.unlinkSync(filePath); // Delete temp file
      return result.secure_url;
  } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      return null; // Return null instead of throwing error
  }
};
module.exports = { upload, uploadToCloudinary };
