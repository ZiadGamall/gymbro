const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Delete One Document (Restricted to Owner if user field exists)
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // Check if the model's schema has a 'user' field
    const hasUserField = Model.schema.paths.user;
    const filter = { _id: req.params.id };
    if (hasUserField && req.user) filter.user = req.user.id;

    const doc = await Model.findOneAndDelete(filter);

    if (!doc) {
      return next(
        new AppError(
          "No document found with that ID or you do not have permission to delete it",
          404,
        ),
      );
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

// Create One Document (Automatically links to logged-in user if applicable)
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const payload = { ...req.body };
    // Only append user if the model expects it
    if (Model.schema.paths.user && req.user) {
      payload.user = req.user.id;
    }

    const doc = await Model.create(payload);

    res.status(201).json({
      status: "success",
      data: doc,
    });
  });

// Get One Document by ID (Restricted to Owner if user field exists)
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    const hasUserField = Model.schema.paths.user;
    const filter = { _id: req.params.id };
    if (hasUserField && req.user) filter.user = req.user.id;

    let query = Model.findOne(filter);
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

// Get All Documents (with optional filtering)
exports.getAllFieldFilter = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    const filter = { ...req.query };
    if (Model.schema.paths.user && req.user) {
      filter.user = req.user.id;
    }

    let query = Model.find(filter).sort({ createdAt: -1 });

    // Dynamically apply population options if they are passed in!
    if (popOptions) query = query.populate(popOptions);

    const docs = await query;

    res.status(200).json({
      status: "success",
      results: docs.length,
      data: docs,
    });
  });
