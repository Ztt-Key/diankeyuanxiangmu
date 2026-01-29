const formatResponse = (req, res, next) => {
  // 扩展 res 对象，添加统一的响应方法
  res.success = function(data = null, msg = "操作成功") {
    // 判断是否是列表数据
    if (data && data.list !== undefined) {
      // 如果是列表数据，使用原来的格式
      res.json({
        code: 0,
        data: {
          list: Array.isArray(data.list) ? data.list : [],
          total: data.total || data.list?.length || 0,
          page: data.page || 1,
          pageSize: data.pageSize || 10
        },
        msg
      });
    } else {
      // 如果不是列表数据，直接返回数据对象
      res.json({
        code: 0,
        data: data,
        msg
      });
    }
  };

  res.error = function(msg = "操作失败", code = 500) {
    res.status(code).json({
      code,
      data: null,
      msg
    });
  };

  next();
};

module.exports = formatResponse; 