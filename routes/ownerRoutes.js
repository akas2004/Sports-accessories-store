const express = require('express');
const router = express.Router();
const passport = require('passport');
const Owner = require('../Models/owner-model');
const Product = require('../Models/Product-model');

// Owner login/signup form route
router.get('/loginSignup', (req, res) => {
  res.render('ownerLoginSignup');
});

// Owner signup route
router.post('/signup', async (req, res, next) => {
  try {
    const { fullname, email, password, contact } = req.body;
    
    // Create a new owner instance
    const newOwner = new Owner({ fullname, email, password, contact });
    await newOwner.save();

    // Automatically log in the owner after signup
    req.login(newOwner, (err) => {
      if (err) {
        return next(err);
      }
      // Redirect to dashboard after successful login
      return res.redirect('/owner/dashboard');
    });
  } catch (err) {
    console.error(err);
    res.redirect('/owner/loginSignup');
  }
});

// Owner login route
router.post('/login', passport.authenticate('local', {
  successRedirect: '/owner/dashboard',
  failureRedirect: '/owner/loginSignup',
  failureFlash: true,  // Display flash messages for errors
}));


// Add this middleware to check if the owner is authenticated


// Owner dashboard route (after successful login)
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    // Fetch all products for the logged-in owner
    const ownerProducts = await Product.find({ ownerId: req.user._id });
    let totalSold = 0;

    // Calculate total number of sold products
    ownerProducts.forEach(product => {
      totalSold += product.sold || 0;
    });

    // Render the dashboard with owner's products and total sold count
    res.render('dashboard', {
      owner: req.user,
      products: ownerProducts,
      totalSold: totalSold,
    });
  } catch (err) {
    console.error(err);
    res.redirect('/owner/loginSignup');
  }
});

// Owner logout route
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

// Ensure the owner is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/owner/loginSignup');
}

router.get('/admin', ensureAuthenticated, async (req, res) => {

  try {
    const ownerProducts = await Product.find({ ownerId: req.user._id });
    res.render('dashboard', { products: ownerProducts, success: req.flash('success') });
  } catch (err) {
    console.error(err);
    res.redirect('/owner/login');
  }
});

module.exports = router;
