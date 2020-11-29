const express = require("express");
const bodyparser = require("body-parser");
const authenticate = require("../authenticate");
const cors = require("./cors");

const Dishes = require("../models/dishes");

const dishRouter = express.Router();

dishRouter.use(bodyparser.json());

dishRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, (req, res, next) => {
    Dishes.find({})
      .populate("comments.author")
      .then(
        (dishes) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(dishes);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Dishes.create(req.body)
        .then(
          (dish) => {
            console.log("Dish Created ", dish);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(dish);
          },
          (err) => next(err)
        )
        .catch((err) => next(err));
    }
  )
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      res.statusCode = 403;
      res.end("PUT operation is not supported on dishes");
    }
  )
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Dishes.remove({})
        .then(
          (resp) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(resp);
          },
          (err) => next(err)
        )
        .catch((err) => next(err));
    }
  );

dishRouter
  .route("/:dishId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, (req, res, next) => {
    Dishes.findById(req.params.dishId)
      .populate("comments.author")
      .then(
        (dish) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(dish);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      res.statusCode = 403;
      res.end("Post operation is not supported on dishes/" + req.params.dishId);
    }
  )
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Dishes.findByIdAndUpdate(
        req.params.dishId,
        {
          $set: req.body,
        },
        { new: true }
      )
        .then(
          (dish) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(dish);
          },
          (err) => next(err)
        )
        .catch((err) => next(err));
    }
  )
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Dishes.findByIdAndRemove(req.params.dishId)
        .then(
          (resp) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(resp);
          },
          (err) => next(err)
        )
        .catch((err) => next(err));
    }
  );

dishRouter
  .route("/:dishId/comments")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, (req, res, next) => {
    Dishes.findById(req.params.dishId)
      .populate("comments.author")
      .then(
        (dish) => {
          if (dish != null) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(dish.comments);
          } else {
            err = new Error("Dish " + req.params.dishId + " not Found");
            err.status = 404;
            return next(err);
          }
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Dishes.findById(req.params.dishId)
      .then(
        (dish) => {
          if (dish != null) {
            req.body.author = req.user._id;
            dish.comments.push(req.body);
            dish.save().then((dish) => {
              Dishes.findById(dish._id)
                .populate("comments.author")
                .then((dish) => {
                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.json(dish);
                });
            });
          } else {
            err = new Error("Dish " + req.params.dishId + " not Found");
            err.status = 404;
            return next(err);
          }
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      "PUT operation is not supported on dishes" +
        req.params.dishId +
        " /comments"
    );
  })
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Dishes.findById(req.params.dishId)
        .then(
          (dish) => {
            if (dish != null) {
              for (var i = dish.comments.length - 1; i >= 0; i--) {
                dish.comments.id(dish.comments[i]._id).remove();
              }
              dish.save().then((dish) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(dish);
              });
            } else {
              err = new Error("Dish " + req.params.dishId + " not Found");
              err.status = 404;
              return next(err);
            }
          },
          (err) => next(err)
        )
        .catch((err) => next(err));
    }
  );

dishRouter
  .route("/:dishId/comments/:commentsId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, (req, res, next) => {
    Dishes.findById(req.params.dishId)
      .populate("comments.author")
      .then(
        (dish) => {
          if (dish != null && dish.comments.id(req.params.commentsId) != null) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(dish.comments.id(req.params.commentsId));
          } else if (dish == null) {
            err = new Error("Dish " + req.params.dishId + " not Found");
            err.status = 404;
            return next(err);
          } else {
            err = new Error("Comment  " + req.params.commentsId + " not Found");
            err.status = 404;
            return next(err);
          }
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      "Post operation is not supported on dishes/" +
        req.params.dishId +
        "/comments/" +
        req.params.commentsId
    );
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Dishes.findById(req.params.dishId)
      .populate("comments.author")
      .then(
        (dish) => {
          if (
            dish.comments.id(req.params.commentsId).author.equals(req.user.id)
          ) {
            if (
              dish != null &&
              dish.comments.id(req.params.commentsId) != null
            ) {
              if (req.body.rating) {
                dish.comments.id(req.params.commentsId).rating =
                  req.body.rating;
              }
              if (req.body.comment) {
                dish.comments.id(req.params.commentsId).comment =
                  req.body.comment;
              }
              dish.save().then((dish) => {
                Dishes.findById(dish._id)
                  .populate("comments.author")
                  .then((dish) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(dish);
                  });
              });
            } else if (dish == null) {
              err = new Error("Dish " + req.params.dishId + " not Found");
              err.status = 404;
              return next(err);
            } else {
              err = new Error(
                "Comment  " + req.params.commentsId + " not Found"
              );
              err.status = 404;
              return next(err);
            }
          } else {
            err = new Error(
              "You are not authorized to change other user comment"
            );
            err.status = 404;
            return next(err);
          }
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Dishes.findById(req.params.dishId)
      .populate("comments.author")
      .then((dish) => {
        if (
          dish.comments.id(req.params.commentsId).author.equals(req.user.id)
        ) {
          Dishes.findById(req.params.dishId)
            .then(
              (dish) => {
                if (
                  dish != null &&
                  dish.comments.id(req.params.commentsId) != null
                ) {
                  dish.comments.id(req.params.commentsId).remove();
                  dish.save().then((dish) => {
                    Dishes.findById(dish._id)
                      .populate("comments.author")
                      .then((dish) => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(dish);
                      });
                  });
                } else if (dish == null) {
                  err = new Error("Dish " + req.params.dishId + " not Found");
                  err.status = 404;
                  return next(err);
                } else {
                  err = new Error(
                    "Comment  " + req.params.commentsId + " not Found"
                  );
                  err.status = 404;
                  return next(err);
                }
              },
              (err) => next(err)
            )
            .catch((err) => next(err));
        } else {
          err = new Error(
            "You are not authorized to delete other user comment"
          );
          err.status = 404;
          return next(err);
        }
      });
  });

module.exports = dishRouter;
