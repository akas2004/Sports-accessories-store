const express = require("express");
const router = express();
const Product = require("../Models/Product-model");
const islogeedin = require("../middlewares/isLogeedIn");
const UserModel = require("../Models/User-model");

// Home route
router.get("/", function (req, res) {
  let error = req.flash("error");
  let message = req.flash("message");
  res.render("index", { message, error, loggedin: false });
});

// Shop route - display all products
router.get("/shop", islogeedin, async function (req, res) {
  try {
    const sortby = req.query.sortby || "newest";
    let products = await Product.find();

    switch (sortby) {
      case "popular":
        // Assuming you have a field like `totalSold` to determine popularity
        products = await Product.find().sort({ price: -1 }); // Sort by most sold
        break;
      case "newest":
        products = await Product.find().sort({ createdAt: -1 }); // Sort by newest
        break;
      case "newCollection":
        products = await Product.find().sort({ createdAt: -1 }); // Same as newest (you can customize)
        break;
      case "allProducts":
        products = await Product.find().sort({ name: 1 }); // Sort by creation date (descending)
        break;
      case "discounted":
        products = await Product.find({ discount: { $gt: 0 } }).sort({
          discount: -1,
        }); // Sort by highest discount
        break;
      case "availability":
        products = await Product.find().sort({ createdAt: -1 }); // Same logic as all products
        break;
      case "discount":
        products = await Product.find({ discount: { $gt: 0 } }).sort({
          discount: -1,
        }); // Similar to discounted
        break;
      default:
        products = await Product.find().sort({ createdAt: -1 }); // Default to newest
        break;
    }
    let success = req.flash("success");
    res.render("shop", { products, success, sortby });
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to load shop");
    res.redirect("/");
  }
});

// Cart route - display user's cart with total breakdown
router.get("/cart", islogeedin, async function (req, res) {
  try {
    if (!req.user || !req.user.email) {
      req.flash("error", "User not authenticated");
      return res.redirect("/");
    }

    let user = await UserModel.findOne({ email: req.user.email }).populate(
      "cart.product"
    );

    if (!user || !Array.isArray(user.cart)) {
      user.cart = []; // Initialize cart if undefined
    }

    // Calculate total breakdown for all products
    let totalMRP = 0;
    let totalDiscount = 0;
    const platformFee = 20;
    const shippingFee = 0;

    user.cart.forEach((item) => {
      if (item.product) {
        totalMRP += item.product.price * item.quantity;
        totalDiscount += item.product.discount * item.quantity;
      }
    });

    const totalAmount = totalMRP - totalDiscount + platformFee + shippingFee;

    res.render("cart", {
      user,
      totalMRP,
      totalDiscount,
      platformFee,
      shippingFee,
      totalAmount,
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to load cart");
    res.redirect("/shop");
  }
});

// Add product to cart route
router.get("/cart/:productid", islogeedin, async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      req.flash("error", "User not authenticated");
      return res.redirect("/");
    }

    let user = await UserModel.findOne({ email: req.user.email }).populate(
      "cart.product"
    );

    if (!user || !Array.isArray(user.cart)) {
      user.cart = [];
    }

    // Find the product to add
    const product = await Product.findById(req.params.productid);

    if (product) {
      // Check if the product is already in the cart
      let cartItem = user.cart.find((item) =>
        item.product._id.equals(product._id)
      );

      if (cartItem) {
        // Increase quantity if already in cart
        cartItem.quantity += 1;
      } else {
        // Add new product to cart
        user.cart.push({ product: product._id, quantity: 1 });
      }

      await user.save();
      req.flash("success", "Added to cart");
    } else {
      req.flash("error", "Product not found");
    }

    res.redirect("/shop");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to add product to cart");
    res.redirect("/shop");
  }
});

// Increase product quantity route
router.get("/cart/increase/:productid", islogeedin, async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      req.flash("error", "User not authenticated");
      return res.redirect("/");
    }

    let user = await UserModel.findOne({ email: req.user.email }).populate(
      "cart.product"
    );

    let cartItem = user.cart.find((item) =>
      item.product._id.equals(req.params.productid)
    );

    if (cartItem) {
      cartItem.quantity += 1;
      await user.save();
    }

    res.redirect("/cart");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to increase product quantity");
    res.redirect("/cart");
  }
});

// Decrease product quantity route
router.get("/cart/decrease/:productid", islogeedin, async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      req.flash("error", "User not authenticated");
      return res.redirect("/");
    }

    let user = await UserModel.findOne({ email: req.user.email }).populate(
      "cart.product"
    );

    let cartItem = user.cart.find((item) =>
      item.product._id.equals(req.params.productid)
    );

    if (cartItem) {
      if (cartItem.quantity > 1) {
        cartItem.quantity -= 1;
      } else {
        // Remove product from cart if quantity is 1
        user.cart.pull({ product: req.params.productid });
      }
      await user.save();
    }

    res.redirect("/cart");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to decrease product quantity");
    res.redirect("/cart");
  }
});

router.post("/checkout", islogeedin, async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      req.flash("error", "User not authenticated");
      return res.redirect("/cart");
    }

    let user = await UserModel.findOne({ email: req.user.email }).populate(
      "cart.product"
    );

    // Calculate total breakdown for all products in the cart
    let totalMRP = 0;
    let totalDiscount = 0;
    const platformFee = 20;

    user.cart.forEach((item) => {
      if (item.product) {
        totalMRP += item.product.price * item.quantity;
        totalDiscount += item.product.discount * item.quantity;
      }
    });

    const totalAmount = totalMRP - totalDiscount;

    res.render("checkout", {
      user,
      totalAmount,
      platformFee,
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to load checkout page");
    res.redirect("/cart");
  }
});

// Checkout Complete Route
// Checkout Complete Route
router.post("/checkout/complete", islogeedin, async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      req.flash("error", "User not authenticated");
      return res.redirect("/cart");
    }

    // Find the user based on the logged-in user's email and populate the products in the cart
    let user = await UserModel.findOne({ email: req.user.email }).populate(
      "cart.product"
    );

    // Ensure the user has a valid cart with items
    if (!user || !Array.isArray(user.cart) || user.cart.length === 0) {
      req.flash("error", "Your cart is empty.");
      return res.redirect("/shop");
    }

    // Extract payment details and shipping address from the request body
    const { paymentMethod, name, email, address, city, zip } = req.body;

    // Calculate total prices
    let totalMRP = 0;
    let totalDiscount = 0;
    const platformFee = 20;

    user.cart.forEach((item) => {
      if (item.product) {
        totalMRP += item.product.price * item.quantity;
        totalDiscount += item.product.discount * item.quantity;
      }
    });

    const totalAmount = totalMRP - totalDiscount + platformFee;

    // Create an order object that includes the products, quantity, and total amount
    const newOrder = {
      items: user.cart.map((item) => ({
        product: {
          _id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          discount: item.product.discount,
        },
        quantity: item.quantity,
      })),
      totalAmount,
      paymentMethod,
      shippingAddress: {
        name,
        email,
        address,
        city,
        zip,
      },
      orderDate: new Date(),
    };

    // Add the new order to the user's orders array
    user.orders.push(newOrder);

    // Clear the user's cart
    user.cart = [];
    await user.save();

    // Redirect to the success page with the payment method passed
    req.session.paymentMethod = paymentMethod; // Storing payment method in session to use in success page
    res.render("success", { paymentMethod });
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to complete the order");
    res.redirect("/cart");
  }
});

// My Account Route - Display user information and order history
router.get("/account", islogeedin, async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      req.flash("error", "User not authenticated");
      return res.redirect("/");
    }

    // Fetch the user based on their email
    let user = await UserModel.findOne({ email: req.user.email }).populate(
      "orders.items.product"
    );

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/");
    }

    // Fetch the user's orders (populated in the user object)
    let orders = user.orders;

    res.render("account", {
      user,
      orders,
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to load account details");
    res.redirect("/");
  }
});

module.exports = router;
