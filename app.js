// shit hill :(
var other = ""
var cs = {}
function isTrueName( table, n ){
   for( let name of table){
      for( let k of Object.keys(name) ){
         if( n === name[k] ) return true
      }
   }
   return false
}

function readFile( file ){
  return new Promise( function( res, rej ){
    var reader = new FileReader()
    reader.onload = ( e ) => res( e.target.result )
    reader.onerror = rej
    reader.readAsText( file )
  })
}

async function modloader( data, addons, glist, chance ){
  var mod = JSON.parse( data ), functions = {
    new_gift( data ){
      // for( let key of Object.keys( datas )){
        // data = datas[key]
        var gift = new Image()
        gift.src = data.icon
        gift.className = "gift"
        gift.data = "[附件: {名称: \"" + data.name + "\", 介绍: \"" + data.description + "\"}]\n"
        gift.onclick = () => {
          Qmsg.info( data.name + " +1" )
          let delate = gift.cloneNode()
          var newitem = new Audio()
          newitem.src = "./sounds/Item.mp3"
          newitem.play()
          delate.onclick = () => {
            other = other.replace( gift.data + "\n", "" )
            Qmsg.info( data.name + " -1" )
            chance.removeChild( delate )
            var rm = new Audio()
            rm.src = "./sounds/btn.mp3"
            rm.play()
          }
          if( chance.children.length >= 20 ){
            Qmsg.error( "最多携带20个礼物！" )
          } else {
            chance.appendChild( delate )
            other += gift.data + "\n"
          }
        }
        glist.appendChild( gift )
      // }
    },
    new_character( data ){
      cs[ data.name ] = cs[ data.character ]
    },
    add_character( data ){
      if( cs[ data.name ] ){
        cs[ data.name ] += cs[ data.character ]
      } else {
        cs[ data.name ] = cs[ data.character ]
      }
    },
    UI( data ){
      var ele = document.createElement( data.type );
      (data.type !== "input" && data.type !== "img") && (ele.textContent = data.text)
      data.id && (ele.id = data.id)
      for( let event of data.events ){
        ele.addEventListener( event.event, () => {
          functions[ event.func ]( publicValue )
        })
      }
      document.getElementById( data.father || "addon-btns" ).appendChild( ele )
    },
    html( html ){
      document.body.innerHTML += html
    },
    log: console.log,
    global( data ){
      if( data.type == "set" ){
        publicValue[ data.name ] = data.value
      } else if( data.type == "remove" ){
        delete publicValue[ data.name ]
      } else if( data.type == "add" ){
        publicValue[ data.name ] += data.value
      } else {
        publicValue[ data.name ] = functions[data.value](publicValue)
      }
    },
    script( data ){
      var func = ( lv ) => eval.call( lv, data )
      return func({
        api: functions,
        global: publicValue
      })
    },
    msg( data ){
      Qmsg[ data.type ]( data.msg )
    },
    $(){}
  }, toFunc = function( key, object ){
    functions[key] = function( data = {} ){
      function dataify( json ){
        for( let key of Object.keys( json ) ){
          if( typeof json[key] == "object" ){
            json[key] = dataify( json[key] )
          } else if( typeof json[key] == "string" ){
            json[key] = loadstring( json[key], data )
          } else {
            continue;
          }
        }
        return json
      }
      for( let key of Object.keys( object ) ){
        if( Array.isArray( object[key] ) ){
          for( let dt of object[key]){
            functions[key]( dataify( { ...publicValue, ...dt } ) )
          }
        } else {
          functions[key]( dataify( { ...publicValue, ...object[key] } ))
        }
      }
    }
  }, readHeader = function( data ){
    addons.innerHTML += `<div class="addon">
      <img class="icon" src="${data.icon}">
      <span class="title">${data.name}</span>
      <p>${data.description}</p>
    </div>`
  }, publicValue = {}
  for( let key of Object.keys( mod )){
    if( key == "header" ){
      readHeader(mod[key])
      continue
    }
    toFunc( key, mod[key] )
  }
  functions.main()
}

async function reimuc( rc ){
   rc.innerHTML = (await (await fetch( "https://finicounter.eu.org/counter?host=reimu.gensokyo.mail" )).json()).views
   Qmsg.info( "(赛钱箱)叮！" )
}

async function kogasac( kc ){
   kc.innerHTML = (await (await fetch( "https://finicounter.eu.org/counter?host=kogasa.gensokyo.mail" )).json()).views
   Qmsg.info( "咱好恨呀~" )
}

async function uploadAddon( file ){
  if( file.files[0] ){
    var json = await readFile( file.files[0] )
    try{ JSON.parse( json ) }catch(err){
      Qmsg.error( "JSON语法错误！" )
      throw err
    }
    var {id} = (await (await fetch( "https://api.youmu.ltd/new/addon", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "string=" + encodeURIComponent( json )
    })).json())
    if( id == 0 ){
      Qmsg.success( "上传成功！详见下文控制台" )
      console.log( "上传成功 (详见: https://gskm-addon.thmobile.xyz/market.html)" )
    } else {
      Qmsg.error( "API请求有误！！！" )
    }
  } else {
    Qmsg.error( "未选择文件！" )
  }
}

async function main( mail, throle, text, btn, term, yibian, gc, chance, upm, file, addons, mark, addonSearch, uploadAddonBtn, uploadAddonSign ){
   var $log = console.log, $err = console.error
   console.log = function( ...string ){
      $log( string.join() )
      term.appendChild( document.createTextNode( string.join() ) )
      term.appendChild( document.createElement( "br" ) )
   }
   console.error = function( ...string ){
      $err( string.join() )
      var font = document.createElement( "font" )
      font.setAttribute( "color", "red" )
      font.appendChild( document.createTextNode( string.join() ) )
      term.appendChild( font )
      term.appendChild( document.createElement( "br" ) )
   }
   var nmap = (await (await fetch( "./name.json" )).json())
   var gifts = (await (await fetch( "./gifts.json" )).json())
   var markDatas = (await (await fetch( "https://api.youmu.ltd/fetch/all" )).json())
   cs = (await (await fetch( "./c.json" )).json())
   var today = formatDate( new Date() ).date
   if( isHoliday( today ) ){
     today += " , " + getFestival( today )
   }
   for( let gift of gifts ){
     let icon = new Image()
     icon.className = "gift"
     icon.data = "[附件: {名称: \"" + gift.name + "\", 介绍: \"" + gift.description + "\"}]\n"
     icon.src = gift.icon
     icon.onclick = () => {
       Qmsg.info( gift.name + " +1" )
       let delate = icon.cloneNode()
       var newitem = new Audio()
       newitem.src = "./sounds/Item.mp3"
       newitem.play()
       delate.onclick = () => {
         other = other.replace( icon.data, "" )
         Qmsg.info( gift.name + " -1" )
         chance.removeChild( delate )
         var rm = new Audio()
         rm.src = "./sounds/btn.mp3"
         rm.play()
       }
       if( chance.children.length >= 20 ){
         Qmsg.error( "最多携带20个礼物！" )
       } else {
         chance.appendChild( delate )
         other += (icon.data = loadstring( icon.data, {
           role: throle.value.trim()
         }))
       }
     }
     gc.appendChild( icon )
   }
   function loadMark( search = "" ){
     mark.innerHTML = ""
     for( let markAddon of markDatas ){
       if( markAddon.passed && (markAddon.name + markAddon.description).includes( search ) ){
         var addon = document.createElement( "div" ),
           img = new Image(),
           title = document.createElement( "span" ),
           description = document.createElement( "p" )
         img.className = "icon"
         img.src = JSON.parse(markAddon.content).header.icon
         title.className = "title"
         title.textContent = markAddon.name
         description.textContent = markAddon.description
         addon.onclick = async () => {
           await modloader( markAddon.content, addons, gc, chance )
           var addsound = new Audio()
           addsound.src = "./sounds/Item.mp3"
           addsound.play()
           Qmsg.success( "Addon加载成功！" )
           addon.onclick = () => {
             Qmsg.error( "您已经加载过本addon了" )
           }
         }
         addon.className = "addon"
         addon.appendChild( img )
         addon.appendChild( title )
         addon.appendChild( description )
         mark.appendChild( addon )
       }
     }
   }
   loadMark()
   addonSearch.oninput = function(){
     loadMark( this.value )
   }
   uploadAddonBtn.onchange = function(){
     uploadAddonSign.textContent = this.value || "未选择文件"
   }
   upm.onclick = async function(){
     try {
       if( file.files[0] ){
         var msg = Qmsg.loading( "Addon加载中" )
         await modloader( await readFile( file.files[0] ), addons, gc, chance )
         var addsound = new Audio()
         addsound.src = "./sounds/Item.mp3"
         addsound.play()
         msg.close()
         Qmsg.success( "Addon加载成功！" )
       } else {
         Qmsg.error( "未选择文件" )
       }
     } catch( err ){
       Qmsg.error( err.toString() )
       console.error( err )
     }
   }
   yibian.onclick = function(){
     throle.value = "博丽灵梦"
     text.value = "有妖怪正在发动异变！快去退治！"
     Qmsg.info( "将 有妖怪 替换成欺负你的妖怪！" )
   }
   btn.onclick = async function(){
      if( mail.value.trim() == "" || !(mail.value.match( /[^\@]+\@[^\@\.]+\.[^\@\.]+/ )) ){
         Qmsg.error( "邮箱名称错误w~" )
         console.error( "邮箱格式错误！" )
      } else if( throle.value.trim() == "" || !isTrueName( nmap, throle.value.trim() ) ){
         Qmsg.error( "未在幻想乡查找到该邮箱w~" )
         console.error( "未在幻想乡查找到该邮箱" )
         for( let no of nmap ){
            for( let i of Object.keys(no) ){
               let v = no[i]
               if( v.indexOf( throle.value.trim() ) > -1 ){
                  console.error( "您在找的是不是: " + v )
               }
            }
         }
      } else if( text.value.trim() == "" ){
         Qmsg.error( "没有找到正文w~" )
         console.error( "正文不能为空" )
      } else {
         try {
            var msg = Qmsg.loading( "正在突破次元壁！" )
            var reply = await (await fetch( "https://api.openai-hk.com/v1/chat/completions", {
               method: "POST",
               headers: {
                  "Authorization": stringDecodeFrom9(
                     await (await fetch( "baka1.txt" )).text() ),
                  "Content-Type": "application/json"
               },
               body: JSON.stringify({
                  model: "gpt-4o-mini",
                  messages: [
                     { role: "system", content: `你是幻想乡的${throle.value.trim()}，这里有一些来自外界的信需要你回复！可以适当使用颜文字！(补充设定:` + (cs[throle.value.trim()] || "") + ")" },
                     { role: "user", content: "[ " + today + " ]\n" + text.value.trim() + "\n" + other }
                  ]
               })
            })).json()
            msg.close()
            Qmsg.success( "信件已被幻想乡接收" )
            msg = Qmsg.loading( "正在转接至邮箱！" )
            // console.log( JSON.stringify( reply))
            var req = await (await fetch( "https://api.mu-jie.cc/email", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                  host: "mail.fds.moe",
                  from: "lovekogasa@mc.fds.moe",
                  pass: stringDecodeFrom9(
                     await (await fetch( "baka2.txt" )).text() ),
                  to: mail.value.trim(),
                  title: "一封来自幻想乡 " + throle.value.trim() + " 的邮件",
                  content: reply.choices[0].message.content
               })
            })).json()
            msg.close()
            if( req.msg === "ok" ){
               Qmsg.success( "转接成功，请检查你的邮箱" )
            } else {
               Qmsg.error( "邮件发送失败，请检查邮箱是否正确" )
            }
         } catch( err ){
            Qmsg.error( "发生了意想不到的错误w~" )
            console.error( err )
         }
      }
   }
   Qmsg.success( "页面渲染完成，欢迎喵 ~" )
}