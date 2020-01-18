const express = require('express')
const jwt = require('jsonwebtoken');
const db = require('../sql')

const router = express.Router()

// cheack token
const vt = (req,res,next)=>{
     let token = req.session.TK
        jwt.verify(token, 'admin', function(err, decoded) {
            if(err){
                res.sendStatus(500)
                // throw err
            }else{
                let id = decoded.id 
                req.session.ID = id
                next()
            }
          });
    }

// start req admin ------------------------------------------------------------------------------------------>

// bring all vication to admin page(1)--------------------------------------->
router.get('/vication',vt,(req,res)=>{
    let all =`SELECT * from vication`
    db.query(all,(err,result,fields)=>{
     if(err){
         res.sendStatus(500)
     }
     res.json(result)
    })
})

// post vication by admin(2)------------------------------------------------->
router.post('/add',vt,(req,res)=>{
    let {Destination,Image,start_date,end_date,Price,Description} = req.body
    let p = `INSERT INTO vication (destination,Image,start_date,end_date,price,Description) VALUES('${Destination}','${Image}','${start_date}','${end_date}',${Price},'${Description}')`
    db.query(p,(err,result,fields)=>{
     if(err){
         res.sendStatus(400)
     }else{
         res.sendStatus(200)
}
    })
})

// delete viaction and foolowers by admin(3)----------------------------------->
router.delete('/delete/:id',vt,(req,res)=>{
    let id = req.params.id
    let num = parseInt(id)
    let d_f = `DELETE FROM follow_vication WHERE vicationID = ${num} `
    let d_c = `DELETE FROM vication WHERE vicationID = ${num} `
    db.query(d_f,(err,result,fields)=>{
     if(err){
         res.sendStatus(400)
     }else{
        db.query(d_c,(err,result,fields)=>{
            if(err){
                res.sendStatus(400)
            }else{
                res.sendStatus(200)
       }
           })     
}
    })
})

// update viaction by admin(4)------------------------------------------------------->
router.put('/update/:id',vt,(req,res)=>{
    let id = parseInt(req.params.id)
    let {Destination1,Image1,start_date1,end_date1,Price1,Description1} = req.body
    let u = `UPDATE vication SET destination = '${Destination1}',Image = '${Image1}',start_date = '${start_date1}',end_date = '${end_date1}',price = ${Price1},Description = '${Description1}' WHERE vicationID = ${id} `
    db.query(u,(err,result,fields)=>{
        if(err){
            res.sendStatus(400)
        }else{
            res.sendStatus(200)
        }
    })
})

// logOut(5)------------------------------------------------------------------->
router.delete('/logOut',(req,res)=>{
    req.session.id = false
    req.session.TK = false
    req.session.logedin = false
    req.session.save()
    res.sendStatus(200)
})

// cheack token----------------------------------------------------------------------->
router.post('/verify',(req,res)=>{
    let token = req.session.TK
        jwt.verify(token, 'admin', function(err, decoded) {
            if(err){
                res.sendStatus(500)
            }else{
                let id = decoded.id 
                let user = decoded.user 
                let DT = [{id},{user}]
                res.json(DT)
            }
        })
})




module.exports = router