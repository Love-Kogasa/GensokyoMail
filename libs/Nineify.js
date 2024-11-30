// 9算式Map
var nineMap = [
   "9-9", "9/9", "(9+9)/9", "(9+9+9)/9", "(9+9+9+9)/9",
   "9-(9+9+9+9)/9", "9-(9+9+9)/9", "9-(9+9)/9",
   "9-9/9", "9"
]
nineMap[ "-" ] = ""

/**
 * 将整数转换为9算式
 * @param {number} num - 要转换的整数
 * @param {boolean} readily - 是否转换为人类可读的算式(例如 / => ÷), 默认为false
 * @return {string} 返回的9算式字符串
 */
function intEncodeTo9( num, readily = false ){
   var nineradix = num.toString(9).split("").reverse(),
      outnum = [], fushu = nineradix.includes( "-" )
   for( let nindex in nineradix ){
      outnum.push( (nindex > 0 ? ("9**(" + nineMap[nindex]  + ")*(" ) : "") + nineMap[ nineradix[nindex] ] + (nindex > 0 ? ")" : "" ) )
   }
   return (fushu ? "-(" : "") + (!readily ?
      outnum.join( "+" ) :
      outnum.join( "+" )
         .replace( /\*/g, "×" )
         .replace( /\//g, "÷" )) + (fushu ? ")" : "")
}

/**
 * 将9算式转换回Int
 * @param {string} num - 要解码的9算式
 * @return {number} 返回int
 */
function intDecodeFrom9( num ){
   var thisnum = num
   if( num.indexOf( "÷" ) >= 0 ) thisnum = num
      .replace( /÷/g, "/" )
      .replace( /×/g, "*" )
   return eval( thisnum )
}

/**
 * 将字符串转换为9算式
 * @param {string} str - 要转换的字符串
 * @param {boolean} readily - 是否转换为人类可读的算式(例如 / => ÷), 默认为false
 * @return {string} 返回的9算式字符串
 */
function stringEncodeTo9( str, readily = false ){
   var retnum = []
   for( let char of str.split( "" ) ){
      retnum.push( intEncodeTo9( char.charCodeAt(), readily ) )
   }
   return retnum.join( "\n" )
}

/**
 * 将9算式转换回字符串
 * @param {string} num - 要解码的9算式
 * @return {string} 返回字符串
 */
function stringDecodeFrom9( str ){
   var retStr = ""
   for( let line of str.split( "\n" ) ){
      retStr += String.fromCharCode( intDecodeFrom9( line ) )
   }
   return retStr
}

/**
 * 将js对象转换为9算式
 * @param {object} str - 要转换的json对象(不应包含函数等类型)
 * @param {boolean} readily - 是否转换为人类可读的算式(例如 / => ÷), 默认为false
 * @return {string} 返回的9算式字符串
 */
function jsonEncodeTo9( json, readily = false ){
   return stringEncodeTo9( JSON.stringify( json ), readily )
}

/**
 * 将9算式转换回Json对象
 * @param {string} num - 要解码的9算式
 * @return {string} 返回字符串
 */
function jsonDecodeFrom9( json ){
   return JSON.parse( stringDecodeFrom9( json ) )
}

/**
 * 将js函数转换为9算式
 * @param {object} str - 要转换的js函数
 * @param {boolean} readily - 是否转换为人类可读的算式(例如 / => ÷), 默认为false
 * @return {string} 返回的9算式字符串
 */
function funcEncodeTo9( func, readily ){
   return stringEncodeTo9( func.toString(), readily )
}

/**
 * 将9算式转换回Js函数
 * @param {string} num - 要解码的9算式
 * @return {string} 返回字符串
 */
function funcDecodeFrom9( func ){
   return eval( "(" + stringDecodeFrom9( func ) + ")" )
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