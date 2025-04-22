// Example for URL: https://res.cloudinary.com/<cloud_name>/image/upload/v1687458491/folder/filename.jpg

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

module.exports = { extractCloudinaryPublicId };
