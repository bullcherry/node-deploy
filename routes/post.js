const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Post, Hashtag } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

fs.readdir('uploads', (err) => {
  if (err) {
    console.log('uploads 폴더가 없으므로 uploads 폴더를 생성합니다.');
    fs.mkdir('uploads');
  }
});

const upload = multer({
  storeage: multer.diskStorage({
    destination(req, file, done) {
      done(null, 'uploads/');
    },
    filename(req, file, done) {
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname);
      const filename = basename + Date.now() + ext;
      done(null, filename);
    },
  }),
  limits: 5 * 1024 * 1024,
});

router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {
  console.log(req.file);
  res.json({ url: `/img/${req.file.filename}` });
});

const upload2 = multer();
router.post('/', isLoggedIn, upload.none(), async (req, res, next) => {
  try {
    const post = Post.create({
      content: req.body.content,
      img: req.body.url,
      userId: req.user.id,
    });

    const hashtags = req.body.content.match(/#[^\s]*/g);
    if (hashtags) {
      const results = await Promise.all(hashtags.map((tag) => {
        Hashtag.findOrCreate({
          where: { title: tag.slice(1).toLowerCase() }
        })
      }));
      await post.addHashtags(results.map(r => r[0]));
    }
    res.redirect('/');
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;