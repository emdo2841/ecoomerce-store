# ecoomerce-store
commerce Store
This is a Node.js-based ecommerce application that provides features for user authentication, product management, and role-based access control. The application is built using Express.js, MongoDB, and other modern tools.

Features
User Authentication:

Register, login, and logout functionality.
Password reset via email.
Update password for logged-in users.
Role-Based Access Control:

Admins can manage users, assign roles, and delete users.
Staff and Admin roles have specific permissions.
Product Management:

Add, update, and delete products.
Fetch products with pagination.
Only return products that are in stock.
Category and Brand Management:

Manage product categories and brands.
Cloudinary Integration:

Upload and manage product images.
Pagination:

Paginated responses for users and products.
Technologies Used
Backend:

Node.js
Express.js
MongoDB (Mongoose)
Passport.js for authentication
Cloudinary for image uploads
Utilities:

dotenv for environment variables
nodemailer for email notifications
winston for logging
Installation
1. Clone the Repository
   git clone https://github.com/emdo2841/ecommerce-store.git
  cd ecommerce-store
3. Install Dependencies
  npm install 
5. Set Up Environment Variables
Create a .env file in the root directory and add the following variables:
  PORT=7000
  MONGO_URL=your-mongodb-connection-string
  SESSION_SECRET=your-session-secret
  CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
  CLOUDINARY_API_KEY=your-cloudinary-api-key
  CLOUDINARY_API_SECRET=your-cloudinary-api-secret
  EMAIL_HOST=your-email-host
  EMAIL_PORT=your-email-port
  EMAIL_USER=your-email-username
  EMAIL_PASS=your-email-password


4. Start the Server
   npm start

The server will start on http://localhost:7000.

API Endpoints
Authentication
Method	Endpoint	Description	Access
POST	/register	Register a new user	Public
POST	/login	Login a user	Public
GET	/logout	Logout the current user	Authenticated
POST	/forgot-password	Send password reset email	Public
POST	/reset-password/:token	Reset password using token	Public
PUT	/update-password	Update password for logged-in user	Authenticated
User Management
Method	Endpoint	Description	Access
GET	users	Get all users	Admin
GET	/user/:id	Get a user by ID	Admin
PUT	/update-role/:id	Update a user's role	Admin
DELETE	/user/:id	Delete a user	Admin
Role-Based Endpoints
Method	Endpoint	Description	Access
GET	/admin	Get all admin users	Admin
GET	/staff	Get all staff users	Admin
GET	/admin-staff	Get all admin and staff users	Admin
GET	/user-role	Get all users with the "user" role	Admin
Product Management
Method	Endpoint	Description	Access
POST	/products	Create a new product	Admin/Staff
GET	/products	Get all products (in stock only)	Public
PUT	/products/:id	Update a product	Admin/Staff
DELETE	/products/:id	Delete a product	Admin/Staff
Project Structure
  ecommerce/
    ├── controllers/
    │   ├── authentication.js    # Handles user authentication and role management
    │   ├── product.js           # Handles product-related operations
    │   ├── category.js          # Handles category-related operations
    │   └── brand.js             # Handles brand-related operations
    ├── middleware/
    │   ├── isAuthenticated.js   # Middleware to check if a user is authenticated
    │   ├── authorizeRole.js     # Middleware to check user roles
    ├── models/
    │   ├── user.js              # User schema and model
    │   ├── product.js           # Product schema and model
    │   ├── category.js          # Category schema and model
    │   └── brand.js             # Brand schema and model
    ├── routes/
    │   ├── authentication.js    # Routes for authentication and user management
    │   ├── product.js           # Routes for product management
    │   ├── category.js          # Routes for category management
    │   └── brand.js             # Routes for brand management
    ├── utilities/
    │   ├── cloudinary.js        # Cloudinary configuration for image uploads
    │   ├── paginate.js          # Pagination utility
    │   └── sendEmail.js         # Email sending utility
    ├── .env                     # Environment variables
    ├── .gitignore               # Files and directories to ignore in Git
    ├── app.js                   # Main application file
    ├── package.json             # Project dependencies and scripts
    └── README.md                # Project documentation
License
This project is licensed under the MIT License. See the LICENSE file for details.

Contact
For any inquiries or issues, please contact:

Name: Jonathan Emmanuel
Email: emmanueljonathan113@gmail.com
GitHub: emdo2841
This README.md file provides a comprehensive overview of your project, including installation instructions, API endpoints, and project structure. You can customize it further based on your specific requirements.  
