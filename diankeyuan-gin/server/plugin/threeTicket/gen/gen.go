package main

import (
	"github.com/flipped-aurora/gin-vue-admin/server/plugin/threeTicket/model"
	"gorm.io/gen"
	"path/filepath"
)

func main() {
	g := gen.NewGenerator(gen.Config{OutPath: filepath.Join("..", "..", "..", "threeTicket", "blender", "model", "dao"), Mode: gen.WithoutContext | gen.WithDefaultQuery | gen.WithQueryInterface})
	g.ApplyBasic(new(model.ThreeTucjetTemplate), new(model.ThreeTicketExamples), //go:generate go mod tidy
		//go:generate go mod download
		//go:generate go run gen.go

		new(model.ThreeTicketSignature),
	)
	g.Execute()
}
