package router

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

var ThreeTicketSignature = new(threeTicketSignature)

type threeTicketSignature struct {}

// Init 初始化 用户签名表 路由信息
func (r *threeTicketSignature) Init(public *gin.RouterGroup, private *gin.RouterGroup) {
	{
	    group := private.Group("threeTicketSignature").Use(middleware.OperationRecord())
		group.POST("createThreeTicketSignature", apiThreeTicketSignature.CreateThreeTicketSignature)   // 新建用户签名表
		group.DELETE("deleteThreeTicketSignature", apiThreeTicketSignature.DeleteThreeTicketSignature) // 删除用户签名表
		group.DELETE("deleteThreeTicketSignatureByIds", apiThreeTicketSignature.DeleteThreeTicketSignatureByIds) // 批量删除用户签名表
		group.PUT("updateThreeTicketSignature", apiThreeTicketSignature.UpdateThreeTicketSignature)    // 更新用户签名表
	}
	{
	    group := private.Group("threeTicketSignature")
		group.GET("findThreeTicketSignature", apiThreeTicketSignature.FindThreeTicketSignature)        // 根据ID获取用户签名表
		group.GET("getThreeTicketSignatureList", apiThreeTicketSignature.GetThreeTicketSignatureList)  // 获取用户签名表列表
	}
	{
	    group := public.Group("threeTicketSignature")
	    group.GET("getThreeTicketSignaturePublic", apiThreeTicketSignature.GetThreeTicketSignaturePublic)  // 用户签名表开放接口
	}
}
