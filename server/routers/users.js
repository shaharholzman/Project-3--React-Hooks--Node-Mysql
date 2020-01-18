const express = require('express')
const jwt = require('jsonwebtoken');
const db = require('../sql')
const bcrypt = require('bcryptjs');

const router = express.Router()

// users--------------------------------------------------------------------------------------->

// בדיקת טוקן למשתמש
const vt = (req,res,next)=>{
     let token = req.session.TK
        jwt.verify(token, 'user', function(err, decoded) {
            if(err){
                res.sendStatus(500)
            }else{
              let id = decoded.id 
              req.session.ID = id
              req.session.save()
              next()
        }
    });
}


// create users(1)------------------------------------------------------->
router.post('/register',(req,res)=>{
    let {firstName,LastName,UserName,password_r} = req.body
    let c = `SELECT Username FROM users`
    if(firstName && LastName && UserName && password_r){
    db.query(c,(err,result,fields)=>{
     if(err){
         res.sendStatus(500)
     }
     let indexNum = result.findIndex( res => res.Username == UserName)
     if(indexNum === -1){
        bcrypt.genSalt(10,(err,salt)=>{
            if(err){
                res.sendStatus(500)
            }else{
                bcrypt.hash(password_r,salt,(err,hash)=>{
                    if (err){
                        res.sendStatus(500)
                    }else{
                        let r = `INSERT INTO users (first_name,Last_Name,Username,password)
                        VALUES('${firstName}','${LastName}','${UserName}','${hash}')`
                        db.query(r,(err1,result1,fields)=>{
                            if(err1){
                                res.sendStatus(500)
                            }else{
                                res.sendStatus(200)
                            }
                        })
                    }
            })
        }
    })   
     }else{
        res.sendStatus(400)
     }
    })
}else{
    res.sendStatus(400)
}

})


//login of user(2)------------------------------------------------------>
router.post('/login',(req,res)=>{
    let {user,password} = req.body
    let u = `SELECT * FROM users where Username = '${user}'`
    if(user && password){
    db.query(u,(err,result,fields)=>{
     if(err){
         res.sendStatus(500)
     }else if(result.length === 0){
        res.sendStatus(422)
    }else{
      bcrypt.compare(password,result[0].password,(err,isOkay)=>{
          if(isOkay){
            if(result[0].isAdmin === 1){
               let id = result[0].id
                jwt.sign({id,user},'admin',{ expiresIn: '2h' },(err,token)=>{
                  if(err){
                  res.sendStatus(500)
                  }else{
                  let admin = true
                  // בדיקה---------------------
                  req.session.TK = token
                  req.session.ID = `${id}`
                  req.session.logedin = true
                  req.session.admin = true
                  req.session.save()
                  console.log(req.session)
                  // בדיקה-------------------
                  let tokenID = [{token},{result},{admin}]
                  res.json(tokenID).sendStatus(200)
             }
            })
        }else{
            let id = result[0].id
            jwt.sign({id,user},'user',{ expiresIn: '2h' },(err,token)=>{
                if(err){
                    res.sendStatus(500)
                }else{
                    let admin = false
                    // בדיקה---------------------
                    req.session.TK = token
                    req.session.id = id
                    req.session.logedin = true
                    req.session.admin = false
                    req.session.save()
                    console.log(req.session)
                    // בדיקה-------------------
                    let tokenID = [{token},{result},{admin}]
                    res.json(tokenID).sendStatus(200)
         }
       })
     }
    }else{
        res.sendStatus(422)
    }
   })
  }
 })
}else{
    res.sendStatus(400)
}

})


// folooww on vication by user(3)------------------------------------------------------------>
router.put('/vication/add-vic/:id',vt,(req,res)=>{
    let userID = req.session.ID
    let id_vication = req.params.id
    let u = `INSERT INTO follow_vication (id,vicationID) VALUES(${userID},${id_vication})`
    let v = `update vication SET followers = followers+1  where vicationID = ${id_vication}`
    db.query(u,(err,result,fields)=>{
     if(err){
         res.sendStatus(400)
     }else{
         db.query(v,(err1,result1,fields1)=>{
             if(err1){
                 res.sendStatus(400)
                }
                res.sendStatus(200)
            })   
        }
    })
})


// un-folooww on vication by user(4)--------------------------------------------------------->
router.post('/vication/un-follow/:id',vt,(req,res)=>{
    let userID = req.session.ID
    let id_vication = req.params.id
    let u = `delete from follow_vication where id = ${userID} and vicationID = ${id_vication}`
    let v = `update vication SET followers = followers-1  where vicationID = ${id_vication}`
    db.query(u,(err,result,fields)=>{
     if(err){
         res.sendStatus(400)
     }else{
         db.query(v,(err1,result1,fields1)=>{
            if(err1){
                res.sendStatus(400)
            }
            res.sendStatus(200)
           })   
     }
    })
})


// bring follow vication(5)-------------------------------------------------------------------->
router.get('/vication/get-follow',vt,(req,res)=>{
    let id_user = req.session.ID
    let my_f =`SELECT
    vication.vicationID,
    vication.Description,
    vication.destination,
    vication.Image,
    vication.start_date,
    vication.end_date,
    vication.price,
    vication.followers
    FROM vication
    inner join follow_vication on  follow_vication.vicationID = vication.vicationID 
    WHERE follow_vication.id = ${id_user}`
    db.query(my_f,(err,result,fields)=>{
     if(err){
         res.sendStatus(500)
     }
     res.json(result)
    })
})


// bring un-follow vication(5)------------------------------------------------------------->
router.get('/vication/get-un/:array',vt,(req,res)=>{
    let followVic = req.params.array
    let my_f =`SELECT
    vication.vicationID,
    vication.Description,
    vication.destination,
    vication.Image,
    vication.start_date,
    vication.end_date,
    vication.price,
    vication.followers
    FROM vication
    where vication.vicationID not in (${followVic})`
    db.query(my_f,(err,result,fields)=>{
     if(err){
         res.sendStatus(500)
     }
     res.json(result)
    })
})

// hendle logOut-------------------------------------------------->
router.delete('/logOut',(req,res)=>{
    req.session.id = false
    req.session.TK = false
    req.session.logedin = false
    req.session.save()
    res.sendStatus(200)
    console.log(req.session)
})

// cheack token----------------------------------------------------------------------->
router.post('/verify',(req,res)=>{
    console.log(req.session)
    let token = req.session.TK
        jwt.verify(token, 'user', function(err, decoded) {
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