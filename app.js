function isTrueName( table, n ){
   for( let name of table){
      for( let k of Object.keys(name) ){
         if( n === name[k] ) return true
      }
   }
   return false
}

async function reimuc( rc ){
   rc.innerHTML = (await (await fetch( "https://finicounter.eu.org/counter?host=reimu.gensokyo.mail" )).json()).views
   Qmsg.info( "(赛钱箱)叮！" )
}

async function kogasac( kc ){
   kc.innerHTML = (await (await fetch( "https://finicounter.eu.org/counter?host=kogasa.gensokyo.mail" )).json()).views
   Qmsg.info( "咱好恨呀~" )
}

async function main( mail, throle, text, btn, term, yibian ){
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
   Qmsg.success( "页面渲染完成，欢迎喵 ~" )
   var nmap = (await (await fetch( "./name.json" )).json())
   var today = formatDate( new Date() ).date
   if( isHoliday( today ) ){
     today += " , " + getFestival( today )
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
                     { role: "system", content: `你是幻想乡的${throle.value.trim()}，这里有一些来自外界的信需要你回复！可以使用颜文字！` },
                     { role: "user", content: "[ " + today + " ]\n" + text.value.trim() }
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
}