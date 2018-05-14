
//处理post得来的数据：取键名、键值和问号用来组成sql语句
exports.handleData = function (data, type) {
  let target = null;
  try {
    target = JSON.parse(data);
  } catch (e) {
    return '请效验数据格式'
  }
  let keyStr = '';
  let values = [];
  let queMarks = '';
  for(let key in target){
    keyStr += ',' + key;
    values.push( target[key] );
    queMarks += ',?';
  }
  queMarks = queMarks.slice(1);
  keyStr = keyStr.slice(1);
  return {
    keyStr,
    values,
    queMarks
  }
}
