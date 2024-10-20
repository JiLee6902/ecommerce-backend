'use strict'
//app.use("/api/v1/", router); 
//là áp dụng cho các router trong file này
//thành ra nên làm cách trên,vì chỉ ra từng thư mục được

const express = require('express');
const { apiKey, permission } = require('../auth/checkAuth');
const router = express.Router();



// cần có một apiKey mới có thể truy cập tới mọi api của backend dù cho là signup hay login
//mọi request trong các folder của routes đều bị middleware này giám sát
router.use(apiKey)
router.use(permission('0000'))

router.use('/v1/api/checkout', require('./checkout'))
router.use('/v1/api/template', require('./template'))
router.use('/v1/api/email', require('./email'))
router.use('/v1/api/rbac', require('./rbac'))
router.use('/v1/api/profile', require('./profile'))
router.use('/v1/api', require('./access'))
router.use('/v1/api/user', require('./user'))
router.use('/v1/api/shop', require('./shop'))
router.use('/v1/api/category', require('./category'))
router.use('/v1/api/discount', require('./discount'))
router.use('/v1/api/inventory', require('./inventory'))
router.use('/v1/api/cart', require('./cart'))
router.use('/v1/api/product', require('./product'))
router.use('/v1/api/upload', require('./upload'))
router.use('/v1/api/comment', require('./comment'))
router.use('/v1/api/notification', require('./notification'))
router.use('/v1/api/admin', require('./admin'))



//check api key (là api key version cho mỗi version or mỗi đối tác)



module.exports = router;



