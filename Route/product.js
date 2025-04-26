
express = require('express');
const productRoute = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { upload } = require("../utilities/cloudinary")


const productController = require("../controllers/product")




// **POST Route to Upload Product with Images**
productRoute.post(
  "/",
  protect,
  authorize("admin"),
  upload.array("images", 5),
  productController.createProduct
);


productRoute.get("/", productController.getProducts);
productRoute.get("/flash-sale", productController.getflashSaleProducts)
productRoute.get(
  "/out-of-stock",
  protect,
  authorize("admin", "staff"), // Only admins can access this route
  productController.getOutOfStockProducts
);

productRoute.put(
  "/:id",
  protect,
  authorize("admin", "staff"),
  upload.array("images",5),
  productController.updateProductFields
);
  productRoute.patch(
    "/:id/add-images",
    protect,
    authorize("admin", "staff"),
    upload.array("images"),
    productController.addProductImages
);
  productRoute.put(
    "/:id/add-images",
    protect,
    authorize("admin", "staff"),
    upload.array("images"),
    productController.addProductImages
  );
  // route to remove images
productRoute.post(
  "/:id/remove-images",
  protect,
  express.json(),
  authorize("admin", "staff"),
  productController.removeProductImages
);
productRoute.put("/review/:id", protect, productController.updateReviewById);
productRoute.get('/:id',productController.getProductsById)

productRoute.delete(
    "/:id",
    protect,
    authorize("admin","staff"), productController.deleteProduct
    
);
productRoute.post("/:id/reviews", protect, productController.createReview)

productRoute.get("/:id/reviews", productController.getReview)

module.exports = productRoute