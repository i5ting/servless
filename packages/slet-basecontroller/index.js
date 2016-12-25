'use strict'

const debug = require('debug')('slet-basecontroller')
const slice = Array.prototype.slice

class Base {
  constructor (app, ctx, next) {
    this.app = app
    this.ctx = ctx
    this.res = this.ctx.res
    this.next = next
    this.renderType = 'default'
    this.data = {}
    this.tpl = 'index'
    this.result = '{verb}() call result'
    this.url = 'redirect url'
    
    //for alias
    this.alias = {
      req: {
        
      },
      res: {}
    }
    
    let self = this
    this.app.defineMiddleware('registerBaseAlias', function registerBaseAlias(ctx, next) {
      if (ctx.request.body) {
        self.reqbody = ctx.request.body
        self.alias.req.body = ctx.request.body
      }

      if (self.ctx.request.query) {
        self.query = ctx.request.query
      }

      // matches "GET /hello/foo" and "GET /hello/bar"
      // self.params['name'] is 'foo' or 'bar'
      if (self.ctx.params) {
        self.params = ctx.params
        self.alias.req.params = ctx.params
      }
  
      if (ctx.response.redirect) {
        self.alias.res.redirect = ctx.response.redirect
        self.redirect = ctx.redirect
      }

      // cookies
      self.alias.req.cookies = ctx.cookies
      // xhr
      self.alias.req.xhr = self.xhr
      // param
      self.alias.req.param = self.param
      // range
      self.alias.req.range = self.range
      // throw
      self.alias.req.throw = ctx.throw
      self.alias.res.throw = ctx.throw

      return next()
    })
    
    this.global_filter = ['koa-bodyparser', 'registerBaseAlias']
  }
  

  before () {

  }
  
  // only for app
  __bindAlias (req, res) {
    for(var k in this.alias.req) {
      let v = this.alias.req[k]
      req[k] = v
    }
    
    for(var k in this.alias.res) {
      let v = this.alias.res[k]
      res[k] = v
    }
  }

  after () {

  }

  write () {
    let write = this.res.write.bind(this.res)
    write.apply(write, arguments)
  }

  end () {
    this.renderType = 'customEnd'
    let end = this.res.end.bind(this.res)
    end.apply(end, arguments)
  }

  get xhr () {
    let val = this.ctx.headers['X-Requested-With'] || ''
    return val.toLowerCase() === 'xmlhttprequest'
  }

  range (size, options) {
    var range = this.ctx.get('Range')
    if (!range) return
    return require('range-parser')(size, range, options)
  }

  param (name, defaultValue) {
    let params = this.params || {}
    let body = this.body || {}
    let query = this.query || {}

    let args = arguments.length === 1
      ? 'name'
      : 'name, default';
    console.log('req.param(' + args + '): Use req.params, req.body, or req.query instead')

    if (null != params[name] && params.hasOwnProperty(name)) return params[name]
    if (null != body[name]) return body[name]
    if (null != query[name]) return query[name]

    return defaultValue
  }

  __execute () {
    let self = this;
    if (this.renderType === 'default') {
      return new Promise(function (resolve, reject) {
        resolve(self.result)
      })
    }

    if (this.renderType === 'view') {
      var obj = {
        data: this.data,
        tpl: this.tpl
      }
      Object.assign(obj, this.result)

      return this.compile(obj.tpl, obj.data).then(function (html) {
        return new Promise(function (resolve, reject) {
          resolve(html ? html : self.result)
        })
      })
    }
    
    // for this.redirect()
    if (this.renderType === 'redirect') {
      return new Promise(function (resolve, reject) {
        resolve(true)
      })
    }
    
    // for this.end()
    if (this.renderType === 'customEnd') {
      return new Promise(function (resolve, reject) {
        resolve(true)
      })
    }
  }
}

module.exports = class BaseController extends Base {
  constructor (app, ctx, next) {
    super(app, ctx, next)
    
    let self = this
    this.app.defineMiddleware('registerBaseControllerAlias', function registerBaseControllerAlias(ctx, next) {
      self.alias.res.render = self.render
      self.alias.res.getTplPath = self.getTplPath
            return next()
    })
    
    this.global_filter.push('registerBaseControllerAlias')
  }
  
  getTplPath (tpl) {
    let self = this
    let viewPath = self.app.opts.root + '/' + self.app.opts.views.path
    return viewPath + '/' + tpl + '.' + self.app.opts.views.extension
  }

  compile (tpl, data) {
    let self = this
    return new Promise(function(resolve, reject){
      resolve(self.result)
    })
  }

  render (tpl, data) {
    this.renderType = 'view'
    if (tpl) this.tpl = tpl
    if (data) this.data = data
  }
}