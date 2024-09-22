const express = require("express");
const router = express.Router();
const productSchema = require('../Models/Product-model');
const Owner = require('../Models/owner-model');  // Ensure the Owner model is imported
const upload = require('../config/multer-config'); // Assuming multer-config is properly set up

router.get('/create', (req, res) => {
  res.render('createproduct' , { success: req.flash('success')});  // Render the product creation page
});
// Route for creating a new product
router.post('/create', upload.single("image"), async (req, res) => {
    try {
        const { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;

        // Create the new product
        const product = await productSchema.create({
            image: req.file.buffer,  // Store image as buffer
            name,
            price,
            discount,
            bgcolor,
            panelcolor,
            textcolor,
            ownerId: req.user._id  // Associate product with the logged-in owner
        });

        // Find the owner and push the new product's ID into the owner's products array
        const owner = await Owner.findById(req.user._id);
        owner.products.push(product._id);
        await owner.save();

        // Flash success message and redirect to owner admin dashboard
        req.flash("success", "Product created successfully");
        res.redirect('/owner/admin');
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to create product");
        res.redirect("/owner/admin");
    }
});

module.exports = router;
