const express = require('express');
const router = express.Router();



router.put('', async(req, res)=>{
    res.send(req.body);
});


router.get('', async(req, res)=>{
    res.send('ssssss');
})


router.delete('/:seedid', async(req, res)=>{
    res.send(req.params.seedid);
});


module.exports = router;

