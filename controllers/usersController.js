// controllers/usersController.js
const usersStorage = require("../storages/usersStorage");
const { body, validationResult } = require("express-validator");

const alphaErr = "must only contain letters.";
const lengthErr = "must be between 1 and 10 characters.";
const emailErr = "must be a valid email address.";
const numErr = "must be a number.";
const ageErr = "must be between 18 and 200.";
const bioErr = "must be less than 200 characters.";

// Validation middleware
const validateUser = [
  body("firstName").trim()
    .isAlpha().withMessage(`First name ${alphaErr}`)
    .isLength({ min: 1, max: 10 }).withMessage(`First name ${lengthErr}`),
  
  body("lastName").trim()
    .isAlpha().withMessage(`Last name ${alphaErr}`)
    .isLength({ min: 1, max: 10 }).withMessage(`Last name ${lengthErr}`),

  body("email").trim()
    .isEmail().withMessage(`Email ${emailErr}`)
    .normalizeEmail(),

  body("age").trim()
    .isInt({ min: 18, max: 200}).withMessage(`Age ${ageErr}`),

  body("bio").trim()
    .isLength({ min: 0, max: 200 }).withMessage(`Bio ${bioErr}`)
];

// Controller actions 
exports.usersListGet = (req, res) => {
    res.render("index", {
      title: "User list",
      users: usersStorage.getUsers(),
    });
};
  
exports.usersCreateGet = (req, res) => {
    res.render("createUser", {
      title: "Create user",
    });
};

// We can pass an entire array of middleware validations to our controller.
exports.usersCreatePost = [
  validateUser,
  // Optional: Check for unique email
  body("email").custom((value) => {
    const users = usersStorage.getUsers();
    const userExists = users.some(user => user.email === value);
    if (userExists) {
      throw new Error("Email already in use.");
    }
    return true;
  }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("createUser", {
        title: "Create user",
        errors: errors.array(),
        // Optionally, pass back the entered data to repopulate the form
        user: req.body,
      });
    }
    const { firstName, lastName, email, age, bio  } = req.body;
    usersStorage.addUser({ firstName, lastName, email, age, bio  });
    res.redirect("/");
  }
];

exports.usersUpdateGet = (req, res) => {
    const user = usersStorage.getUser(req.params.id);
    if (!user) {
        return res.status(404).send("User not found");
    }
    res.render("updateUser", {
      title: "Update user",
      user: user,
    });
  };
  
  exports.usersUpdatePost = [
    validateUser,
    (req, res) => {
      const user = usersStorage.getUser(req.params.id);
      if (!user) {
        return res.status(404).send("User not found");
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).render("updateUser", {
          title: "Update user",
          user: {...user, ...req.body },
          errors: errors.array(),
        });
      }

      const { firstName, lastName, email, age, bio  } = req.body;
      usersStorage.updateUser(req.params.id, { firstName, lastName, email, age, bio  });
      res.redirect("/");
    }
  ];
  
  // Tell the server to delete a matching user, if any. Otherwise, respond with an error.
exports.usersDeletePost = (req, res) => {
    usersStorage.deleteUser(req.params.id);
    res.redirect("/");
  };

// Controller to handle the GET request for searching users
exports.searchUserGet = (req, res) => {
    const { name, email } = req.query;
    const users = usersStorage.getUsers();
    let filteredUsers = users;
  
    // Search by name (first name or last name) or email, ignoring case and allowing partial matches
    if (name) {
      const lowerCaseName = name.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.firstName.toLowerCase().includes(lowerCaseName) ||
        user.lastName.toLowerCase().includes(lowerCaseName)
      );
    }
  
    if (email) {
      const lowerCaseEmail = email.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.email.toLowerCase().includes(lowerCaseEmail)
      );
    }
  
    // Render the search result page with the filtered users
    res.render("search", {
      title: "Search Results",
      users: filteredUsers,
    });
  };  