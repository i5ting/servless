'use strict'

const Slet = require('./packages/slet')

const app = new Slet()

class MyController extends Slet.BaseController {
  get (req, res) { 
    var a = req.query.a

    //  res.locals.user = {a:1}
    // return res.body = `hello world ${a}`
    // res.send(`hello world ${a}`)
    // return res.download('/lerna.json')
    // res.status = 201
    // return res.sendStatus(200)
    return res.jsonp(null)
    return res.location('/foo/bar');

    // return res.setStatus(201).end('sss')
  }
  
  post(req, res) {
    var a = this.pp.a
    
    return res.body = "ssss" +a
  } 
}

app.router('/:id', MyController)

app.start(3000) 
