const express = require('express');
const Favorite = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({ user: req.user._id })
    .populate('user')
    .populate('campsites')
    .then(favorites => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({user: req.user._id})
    .then(favorites => {
        if (favorites) {  
            for (let i = 0; i < req.body.length; i++) {
              if (favorites.campsites.indexOf(req.body[i]._id) === -1) { 
                favorites.campsites.push(req.body[i]._id); 
              } 
              else {
                err = new Error(`Campsite ${req.body[i]._id} is already in your favorites.`);
                err.status = 404;
                return next(err);
              }
            }
            favorites.save()
            .then(favorites => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(favorites);
            })
        } else {
            Favorite.create({ user: req.user._id, campsites: req.body })
            .then(favorite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
            .catch(err => next(err));
        }
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    if(Favorite){
        Favorite.findOneAndDelete({ user: req.user._id })
        .then(favorites => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end("Favorites Deleted!")
        })
        .catch(err => next(err));
    } else {
        err = new Error(`No favorites to delete!`);
        err.status = 404;
        return next(err);
    }
});

favoriteRouter.route('/:campsiteId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, authenticate.verifyUser, (req, res) => {
  res.statusCode = 403;
  res.end(`GET operation not supported on favorites`);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  Favorite.findOne({user: req.user._id}) 
  .then(favorites => {
    if (favorites) {   
      if (favorites.campsites.includes(req.params.campsiteId)) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.send(`${req.params.campsiteId} is already in your list of favorites.`);
      } else { 
        favorites.campsites.push(req.params.campsiteId);
        favorites.save()
        .then(favorites => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(favorites);
        })
      }
      } else {
        Favorite.create({user: req.user._id, campsites: req.body})
        .then(favorite => {
          console.log('Favorite added', favorite);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(favorite);
        })
      } 
  })
  .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
  res.statusCode = 403;
  res.end(`PUT operation not supported on favorites`);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({user: req.user._id}) 
  .then(favorites => {
    if (favorites) {   
      if (favorites.campsites.includes(req.params.campsiteId)) {
        favorites.campsites.splice(favorites.campsites.indexOf(req.params.campsiteId),1);  
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
        favorites.save()
      } else { 
        err = new Error(`Campsite ${req.params.campsiteId} is not in your favorites.`);
        err.status = 404;
        return next(err);
      }
      } 
  })
    .catch(err => next(err));
});

module.exports = favoriteRouter;