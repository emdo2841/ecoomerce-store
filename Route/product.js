
express = require('express');
const productRoute = express.Router();
const checkRole = require('../middleware/checkRole')
const isAuthenticated = require('../middleware/isAuthenticated')
const { upload } = require("../utilities/cloudinary")


const productController = require("../controllers/product")




// **POST Route to Upload Product with Images**
productRoute.post(
  "/",
  isAuthenticated,
  checkRole(["admin"]),
  upload.array("images", 5),
  productController.createProduct
);


productRoute.get("/", productController.getProducts );

productRoute.put('/:id', isAuthenticated, productController.updateProductById);
productRoute.get('/:id',productController.getProductsById)

productRoute.delete(
    "/:id",
    isAuthenticated,
    checkRole(["admin"]), productController.deleteProduct
    
);
module.exports = productRoute


