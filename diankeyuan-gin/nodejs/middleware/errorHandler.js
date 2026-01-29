const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.error(err.message || '服务器内部错误');
};

module.exports = errorHandler; 