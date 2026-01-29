const ticketTemplateService = require('../services/ticketTemplateService');

class TicketTemplateController {
  async getThreeTicketTemplateList(req, res, next) {
    try {
      console.log('req.query', req.query);
      const params = {
        page: parseInt(req.query.page) || 1,
        pageSize: parseInt(req.query.pageSize) || 10,
        startCreatedAt: req.query.startCreatedAt,
        endCreatedAt: req.query.endCreatedAt,
        templeId: req.query.templeId ? parseInt(req.query.templeId) : null,
        applicantName: req.query.applicantName,
        applicantId: req.query.applicantId,
        currentUserId: req.query.currentUserId ? parseInt(req.query.currentUserId) : null
      };

      const result = await ticketTemplateService.getTemplateList(params);
      
      // 添加错误处理和数据验证
      if (!result || !result.list) {
        return res.json({
          code: 0,
          data: {
            list: [],
            total: 0,
            page: params.page,
            pageSize: params.pageSize
          },
          message: "获取成功"
        });
      }

      res.json({
        code: 0,
        data: result,
        message: "获取成功"
      });
    } catch (error) {
      console.error('获取列表失败:', error);
      next(error);
    }
  }

  async getUsersByAuthority(req, res, next) {
    try {
      const authorityId = req.query.authorityId || '8580';
      const users = await ticketTemplateService.getUsersByAuthorityId(authorityId);
      res.success({ list: users }, "获取用户列表成功");
    } catch (error) {
      next(error);
    }
  }

  async updateTicketStatus(req, res, next) {
    try {
      const result = await ticketTemplateService.updateTicketStatus({
        ID: req.body.ID,
        approved: req.body.approved,
        nextIndex: req.body.nextIndex,
        noIndex: req.body.noIndex,
        auditContent: req.body.auditContent,
        auditorId: req.body.auditorId,
        auditorName: req.body.auditorName,
        comment: req.body.comment
      });
      res.success(result, "审核操作成功");
    } catch (error) {
      next(error);
    }
  }
  // 处理延期申请
  async handleExtension(req, res, next) {
    try {
      const result = await ticketTemplateService.handleExtension({
        ID: req.body.ID,
        userId: req.body.userId,
        userName: req.body.userName,
        content: req.body.content
      });
      res.success(result, "延期申请提交成功");
    } catch (error) {
      next(error);
    }
  }

  // 处理变更负责人
  async handleChangeResponsible(req, res, next) {
    try {
      const result = await ticketTemplateService.handleChangeResponsible({
        ID: req.body.ID,
        userId: req.body.userId,
        userName: req.body.userName,
        content: req.body.content
      });
      res.success(result, "变更负责人申请提交成功");
    } catch (error) {
      next(error);
    }
  }

  // 处理工作完成
  async handleComplete(req, res, next) {
    try {
      console.log('req.body', req.body);
      const result = await ticketTemplateService.handleComplete({
        ID: req.body.ID,
        userId: req.body.userId,
        userName: req.body.userName,
        content: req.body.content
      });
      res.success(result, "工作已标记为完成");
    } catch (error) {
      next(error);
    }
  }

  // 更新工作状态
  async updateWorkStatus(req, res, next) {
    try {
      const result = await ticketTemplateService.updateWorkStatus({
        ID: req.body.ID,
        userId: req.body.userId,
        userName: req.body.userName,
        content: req.body.content,
        dailyLog: req.body.dailyLog
      });
      res.success(result, "工作状态已更新");
    } catch (error) {
      next(error);
    }
  }
    // 处理变更负责人审核
    async approveChange(req, res, next) {
      try {
        const result = await ticketTemplateService.approveChange({
          ID: req.body.ID,
          userId: req.body.userId,
          userName: req.body.userName,
          content: req.body.content
        });
        res.success(result, "审核处理成功");
      } catch (error) {
        next(error);
      }
    }
    // 添加终结审核处理方法
    async handleCompleteAudit(req, res, next) {
      try {
        console.log('req.body');
        const result = await ticketTemplateService.handleCompleteAudit({
          ID: req.body.ID,
          userId: req.body.userId,
          userName: req.body.userName,
          content: req.body.content
        });
        res.success(result, "审核处理成功");
      } catch (error) {
        next(error);
      }
    }

  // 处理工作票作废
  async handleVoid(req, res, next) {
    try {
      const result = await ticketTemplateService.handleVoid({
        ID: req.body.ID,
        userId: req.body.userId,
        userName: req.body.userName,
        content: req.body.content
      });
      res.success(result, "工作票已作废");
    } catch (error) {
      next(error);
    }
  }

  // 添加新的控制器方法
  async getAllTicketList(req, res, next) {
    try {
      const params = {
        page: parseInt(req.query.page) || 1,
        pageSize: parseInt(req.query.pageSize) || 10,
        startCreatedAt: req.query.startCreatedAt,
        endCreatedAt: req.query.endCreatedAt,
        templeId: req.query.templeId ? parseInt(req.query.templeId) : null,
        applicantName: req.query.applicantName,
        isAllAccess: true // 标记为全访问模式
      };

      const result = await ticketTemplateService.getAllTemplateList(params);
      
      res.json({
        code: 0,
        data: result,
        message: "获取成功"
      });
    } catch (error) {
      next(error);
    }
  }

  // 添加签名上传控制器方法
  async uploadSignature(req, res, next) {
    console.log('上传成功');
    try {
      console.log('req.body', req.body.signature);
      const signaturePath = await ticketTemplateService.handleSignatureImage(req.body.signature);
      res.json({
        code: 0,
        data: { path: signaturePath },
        message: "上传成功"
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取three_tucjet_template全部列表
  async getTucjetTemplateList(req, res, next) {
    try {
      const templates = await ticketTemplateService.getTucjetTemplateList();
      
      res.json({
        code: 0,
        data: templates,
        message: "获取成功"
      });
    } catch (error) {
      next(error);
    }
  }

  // 添加新的文件上传控制器方法
  async uploadSignatureFile(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          code: 1,
          message: "没有上传文件"
        });
      }
      console.log('req.file', req.file);
      // 生成文件的相对路径
      const relativePath = `/work/${req.file.filename}`;

      res.json({
        code: 0,
        data: { 
          path: relativePath,
          originalName: req.file.originalname,
          size: req.file.size
        },
        message: "上传成功"
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TicketTemplateController(); 