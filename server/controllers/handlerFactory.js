const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Delete One Document (Restricted to Owner)
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id, // Ensures users can only delete their own data
    });

    if (!doc) {
      return next(
        new AppError(
          "No document found with that ID associated with this user",
          404,
        ),
      );
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

// Create One Document (Automatically links to logged-in user)
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const payload = { ...req.body, user: req.user.id };
    const doc = await Model.create(payload);

    res.status(201).json({
      status: "success",
      data: doc,
    });
  });

// Get One Document by ID (Restricted to Owner)
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findOne({ _id: req.params.id, user: req.user.id });
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: doc,
    });
  });

// Get All Documents for the logged-in user (with optional filtering)
exports.getAllFieldFilter = (Model) =>
  catchAsync(async (req, res, next) => {
    // Build filter based on logged-in user and any extra query params (like date)
    const filter = { user: req.user.id, ...req.query };

    const docs = await Model.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: docs.length,
      data: docs,
    });
  });
