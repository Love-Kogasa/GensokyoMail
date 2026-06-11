// ⑨算式Map —— 将整数映射为仅含数字9的算式
// 这不是加密，是信仰（⑨）
var nineMap = [
   "9-9", "9/9", "(9+9)/9", "(9+9+9)/9", "(9+9+9+9)/9",
   "9-(9+9+9+9)/9", "9-(9+9+9)/9", "9-(9+9)/9",
   "9-9/9", "9"
]
nineMap[ "-" ] = ""

/**
 * 安全四则运算求值器 —— 替代危险的 eval()
 * 仅支持: 整数、+、-、*、/、**、(、)
 */
function safeEval(expr) {
   var s = expr.replace(/\s+/g, '')
   var p = 0

   function peek() { return s[p] }
   function next() { return s[p++] }

   function parseExpr() {
      var left = parseTerm()
      while (peek() === '+' || peek() === '-') {
         var op = next()
         var right = parseTerm()
         left = op === '+' ? left + right : left - right
      }
      return left
   }

   function parseTerm() {
      var left = parsePower()
      while (peek() === '*' && s[p + 1] !== '*') {
         next()
         left = left * parsePower()
      }
      while (peek() === '/' && s[p + 1] !== '*') {
         next()
         var divisor = parsePower()
         if (divisor === 0) throw new Error('⑨不能除以零！')
         left = left / divisor
      }
      return left
   }

   function parsePower() {
      var left = parseUnary()
      while (peek() === '*' && s[p + 1] === '*') {
         next(); next()
         left = left ** parseUnary()
      }
      return left
   }

   function parseUnary() {
      if (peek() === '-') {
         next()
         return -parseUnary()
      }
      return parseAtom()
   }

   function parseAtom() {
      if (peek() === '(') {
         next()
         var val = parseExpr()
         if (peek() === ')') next()
         return val
      }
      var num = ''
      while (peek() && /[0-9]/.test(peek())) {
         num += next()
      }
      if (num === '') throw new Error('⑨算式中出现了不明字符！')
      return parseInt(num, 10)
   }

   var result = parseExpr()
   if (p < s.length) throw new Error('⑨算式解析未完成，多余的字符: ' + s.slice(p))
   return result
}

/**
 * 将整数转换为⑨算式
 * @param {number} num - 要转换的整数
 * @param {boolean} readily - 是否转换为人类可读的算式(例如 / => ÷), 默认为false
 * @return {string} 返回的⑨算式字符串
 */
function intEncodeTo9( num, readily ) {
   var nineradix = num.toString(9).split("").reverse(),
      outnum = [], fushu = nineradix.includes( "-" )
   for( var nindex in nineradix ){
      outnum.push( (nindex > 0 ? ("9**(" + nineMap[nindex]  + ")*(" ) : "") + nineMap[ nineradix[nindex] ] + (nindex > 0 ? ")" : "" ) )
   }
   return (fushu ? "-(" : "") + (!readily ?
      outnum.join( "+" ) :
      outnum.join( "+" )
         .replace( /\*/g, "×" )
         .replace( /\//g, "÷" )) + (fushu ? ")" : "")
}

/**
 * 将⑨算式转换回Int（安全求值，不使用 eval）
 * @param {string} num - 要解码的⑨算式
 * @return {number} 返回int
 */
function intDecodeFrom9( num ){
   var thisnum = num
   if( num.indexOf( "÷" ) >= 0 ) thisnum = num
      .replace( /÷/g, "/" )
      .replace( /×/g, "*" )
   return safeEval( thisnum )
}

/**
 * 将字符串转换为⑨算式
 * @param {string} str - 要转换的字符串
 * @param {boolean} readily - 是否转换为人类可读的算式(例如 / => ÷), 默认为false
 * @return {string} 返回的⑨算式字符串
 */
function stringEncodeTo9( str, readily ) {
   var retnum = []
   for( var char of str.split( "" ) ){
      retnum.push( intEncodeTo9( char.charCodeAt(), readily ) )
   }
   return retnum.join( "\n" )
}

/**
 * 将⑨算式转换回字符串
 * @param {string} num - 要解码的⑨算式
 * @return {string} 返回字符串
 */
function stringDecodeFrom9( str ){
   var retStr = ""
   for( var line of str.split( "\n" ) ){
      retStr += String.fromCharCode( intDecodeFrom9( line ) )
   }
   return retStr
}

/**
 * 将js对象转换为⑨算式
 * @param {object} str - 要转换的json对象(不应包含函数等类型)
 * @param {boolean} readily - 是否转换为人类可读的算式(例如 / => ÷), 默认为false
 * @return {string} 返回的⑨算式字符串
 */
function jsonEncodeTo9( json, readily ) {
   return stringEncodeTo9( JSON.stringify( json ), readily )
}

/**
 * 将⑨算式转换回Json对象
 * @param {string} num - 要解码的⑨算式
 * @return {string} 返回字符串
 */
function jsonDecodeFrom9( json ){
   return JSON.parse( stringDecodeFrom9( json ) )
}

/**
 * 将js函数转换为⑨算式
 * @param {object} str - 要转换的js函数
 * @param {boolean} readily - 是否转换为人类可读的算式(例如 / => ÷), 默认为false
 * @return {string} 返回的⑨算式字符串
 */
function funcEncodeTo9( func, readily ){
   return stringEncodeTo9( func.toString(), readily )
}

/**
 * 将⑨算式转换回Js函数（安全求值，不使用 eval）
 * @param {string} num - 要解码的⑨算式
 * @return {Function} 返回函数
 */
function funcDecodeFrom9( func ){
   return new Function( "return (" + stringDecodeFrom9( func ) + ")" )()
}

if( typeof module == "object" ) module.exports =
{
   intEncodeTo9,
   intDecodeFrom9,
   stringEncodeTo9,
   stringDecodeFrom9,
   jsonEncodeTo9,
   jsonDecodeFrom9,
   funcEncodeTo9,
   funcDecodeFrom9
}
