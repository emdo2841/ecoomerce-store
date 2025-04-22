const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ,
  api_key: process.env.CLOUDINARY_API_KEY ,
  api_secret: process.env.CLOUDINARY_API_SECRET  
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
// Example for URL: https://res.cloudinary.com/<cloud_name>/image/upload/v1687458491/folder/filename.jpg


// const deleteFromCloudinary = async (url) => {
//   try {
//     const publicId = extractCloudinaryPublicId(url);
//     if (publicId) {
//       await cloudinary.uploader.destroy(publicId);
//     }
//   } catch (error) {
//     console.error("Cloudinary Delete Error:", error);
//   }
// };
function extractCloudinaryPublicId(url) {
  if (!url) return null;

  try {
    // Remove any query params
    const cleanUrl = url.split("?")[0];

    // Get path after "/upload/"
    const parts = cleanUrl.split("/upload/");
    if (parts.length < 2) return null;

    const publicIdWithExtension = parts[1]; // e.g. folder/filename.jpg

    // Remove file extension
    const publicId = publicIdWithExtension.split(".").slice(0, -1).join(".");

    return publicId;
  } catch (error) {
    console.error("Failed to extract publicId:", error);
    return null;
  }
}
module.exports = {
  upload,
  uploadToCloudinary,
  extractCloudinaryPublicId,
  // deleteFromCloudinary,
};
