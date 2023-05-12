const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Post, Hashtag } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

// fs.readdir('uploads', (err) => {
//   if (err) {
//     console.log('uploads 폴더가 없으므로 uploads 폴더를 생성합니다.');
//     fs.mkdirSync('uploads');
//   }
// });

try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
  fs.mkdirSync('uploads');
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {      
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname, ext);
      const filename = basename + Date.now() + ext;
      cb(null, filename);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {  
  res.json({ url: `/img/${req.file.filename}` });
});

const upload2 = multer();
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
  try {    
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      userId: req.user.id,
    });

    const hashtags = req.body.content.match(/#[^\s]+/g);
    if (hashtags) {
      const results = await Promise.all(hashtags.map(tag => {        
        return Hashtag.findOrCreate({
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