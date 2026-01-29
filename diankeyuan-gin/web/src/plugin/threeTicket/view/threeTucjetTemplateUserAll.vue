<template>
  <div>
    <div class="gva-search-box">
      <el-form ref="elSearchFormRef" :inline="true" :model="searchInfo" class="demo-form-inline" :rules="searchRule"
        @keyup.enter="onSubmit">
        <el-form-item label="创建日期" prop="createdAt">
          <template #label>
            <span>
              创建日期
              <el-tooltip content="搜索范围是开始日期（包含）至结束日期（不包含）">
                <el-icon>
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </span>
          </template>
          <el-date-picker v-model="searchInfo.startCreatedAt" type="datetime" placeholder="开始日期"
            :disabled-date="time => searchInfo.endCreatedAt ? time.getTime() > searchInfo.endCreatedAt.getTime() : false"></el-date-picker>
          —
          <el-date-picker v-model="searchInfo.endCreatedAt" type="datetime" placeholder="结束日期"
            :disabled-date="time => searchInfo.startCreatedAt ? time.getTime() < searchInfo.startCreatedAt.getTime() : false"></el-date-picker>
        </el-form-item>

        <el-form-item label="绑定模板ID" prop="templeId">
          <el-input v-model="searchInfo.templeId" placeholder="搜索条件" />
        </el-form-item>
        <el-form-item label="申请人姓名" prop="applicantName">
          <el-input v-model="searchInfo.applicantName" placeholder="搜索条件" />
        </el-form-item>

        <template v-if="showAllQuery">
          <!-- 将需要控制显示状态的查询条件添加到此范围内 -->
        </template>

        <el-form-item>
          <el-button type="primary" icon="search" @click="onSubmit">查询</el-button>
          <el-button icon="refresh" @click="onReset">重置</el-button>
          <!-- <el-button link type="primary" icon="arrow-down" @click="showAllQuery = true"
            v-if="!showAllQuery">展开</el-button>
          <el-button link type="primary" icon="arrow-up" @click="showAllQuery = false" v-else>收起</el-button> -->
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <div class="gva-btn-list">
        <el-button type="primary" icon="plus" @click="openDialog()">新增</el-button>
        <!-- <el-button  icon="delete" style="margin-left: 10px;" :disabled="!multipleSelection.length" @click="onDelete">删除</el-button> -->
        <el-button type="primary" :icon="showUnaudited ? 'View' : 'Hide'" @click="toggleUnaudited">
          {{ showUnaudited ? '显示全部' : '只看未审核' }}
        </el-button>
      </div>
      <el-table ref="multipleTable" style="width: 100%" tooltip-effect="dark" :data="tableData" row-key="ID"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />

        <el-table-column align="left" label="日期" prop="createdAt" width="180">
          <template #default="scope">{{ formatDate(scope.row.CreatedAt) }}</template>
        </el-table-column>

        <el-table-column label="内容" prop="value" show-overflow-tooltip>
          <template #default="scope">
            <el-popover placement="right" trigger="hover" :width="400" popper-class="value-popover">
              <template #reference>
                <div class="value-preview">
                  {{ getPreviewContent(scope.row) }}
                </div>
              </template>

              <!-- 浮窗内容 -->
              <div class="popover-content">
                <template v-if="parseValueData(scope.row.value)">
                  <div v-for="(field, index) in parseValueData(scope.row.value)" :key="index" class="popover-item">
                    <div class="popover-label">{{ field.name }}:</div>
                    <div class="popover-value">
                      <!-- 表格类型 -->
                      <template v-if="field.type === 'table'">
                        <el-table :data="field.value" border size="small" style="width: 100%">
                          <el-table-column v-for="col in field.columns" :key="col.key" :prop="col.key"
                            :label="col.title" :min-width="getColumnWidth(col.type)">
                            <template #default="scope">
                              <template v-if="col.type === 'checkbox'">
                                <el-tag :type="scope.row[col.key] ? 'success' : 'info'" size="small">
                                  {{ scope.row[col.key] ? '是' : '否' }}
                                </el-tag>
                              </template>
                              <template v-else>
                                {{ scope.row[col.key] || '-' }}
                              </template>
                            </template>
                          </el-table-column>
                        </el-table>
                      </template>

                      <template v-if="field.type === 'signature'">
                        <img
                          v-if="field.value && typeof field.value === 'string' && field.value.startsWith('data:image')"
                          :src="field.value" class="signature-image" alt="签名"
                          style="max-width: 200px; max-height: 100px; border: 1px solid #dcdfe6; border-radius: 2px; padding: 2px;" />
                        <span v-else>-</span>
                      </template>

                      <!-- 其他类型 -->
                      <template v-else>
                        {{ formatValueForPopover(field) }}
                      </template>
                    </div>
                  </div>
                </template>
                <div v-else>无数据</div>
              </div>
            </el-popover>
          </template>
        </el-table-column>

        <el-table-column align="left" label="绑定模板ID" prop="templeId" width="120" />
        <el-table-column align="left" label="申请人ID" prop="applicantId" width="120" />
        <el-table-column align="left" label="申请人姓名" prop="applicantName" width="120" />
        <el-table-column align="left" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row) || 'info'">
              {{ getStatusText(scope.row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column align="left" label="操作" fixed="right" min-width="240">
          <template #default="scope">
            <!-- 基础操作按钮 -->
            <el-button type="primary" link class="table-button" @click="getDetails(scope.row)">
              <el-icon style="margin-right: 5px">
                <InfoFilled />
              </el-icon>查看
            </el-button>
            
            <!-- 添加新开按钮 -->
            <el-button 
              v-if="canCreateNew(scope.row)"
              type="warning" 
              link 
              @click="createNewFromExisting(scope.row)"
            >
              <el-icon style="margin-right: 5px"><DocumentCopy /></el-icon>
              新开
            </el-button>
            
            <!-- 审核操作按钮 -->
            <template v-for="action in getAuditActions(scope.row)" :key="action.type">
              <el-button :type="action.type" link @click="action.action">
                {{ action.name }}
              </el-button>
            </template>
            <!-- 工作执行阶段的操作按钮 -->
            <template v-if="isWorkExecutionPhase(scope.row)">
              <el-button v-for="action in getWorkExecutionActions(scope.row)" :key="action.type" type="primary" link
                @click="action.action">
                {{ action.name }}
              </el-button>
            </template>

            <!-- 其他阶段的操作按钮 -->
            <template v-else>
              <el-button v-if="canEdit(scope.row)" type="primary" link icon="edit"
                @click="updateThreeTicketExamplesFunc(scope.row)">
                编辑
              </el-button>
              <el-button v-if="canAudit(scope.row)" type="primary" link icon="check"
                @click="openAuditDialog(scope.row)">
                审核
              </el-button>
            </template>
            <el-button type="primary" link icon="Printer" v-if="canPrint(scope.row)" @click="printTicket(scope.row)">
              打印
            </el-button>
            <!-- 现有按钮 -->
            <el-button
              v-if="canVoid(scope.row)"
              type="danger"
              size="small"
              @click="confirmVoid(scope.row)"
            >
              作废
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="gva-pagination">
        <el-pagination layout="total, sizes, prev, pager, next, jumper" :current-page="page" :page-size="pageSize"
          :page-sizes="[10, 30, 50, 100]" :total="total" @current-change="handleCurrentChange"
          @size-change="handleSizeChange" />
      </div>
    </div>
    <el-drawer destroy-on-close size="800" v-model="dialogFormVisible" :show-close="false" :before-close="closeDialog">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg">{{ type === 'create' ? '新增' : '编辑' }}</span>
          <div>
            <el-button :loading="btnLoading" type="primary" @click="enterDialog">确 定</el-button>
            <el-button @click="closeDialog">取 消</el-button>
          </div>
        </div>
      </template>

      <el-form :model="formData" label-position="top" ref="elFormRef" :rules="rule" label-width="80px">
        <el-form-item label="选择模板:" prop="templateId">
          <el-select v-model="selectedTemplateId" placeholder="请选择模板" @change="onTemplateChange">
            <el-option v-for="template in templates" :key="template.ID" :label="template.name" :value="template.ID" />
          </el-select>
        </el-form-item>

        <template v-for="(field, index) in selectedTemplateFields" :key="index">
          <el-form-item :label="field.name" :prop="field.name">
            <!-- 普通输入框 -->
            <el-input v-if="field.type === 'input'" v-model="field.value" :placeholder="field.placeholder"
              :required="field.required" />

            <!-- 多行文本框 -->
            <el-input v-else-if="field.type === 'textarea'" v-model="field.value" type="textarea" :rows="4"
              :placeholder="field.placeholder" :required="field.required" />

            <!-- 输入列表 -->
            <div v-else-if="field.type === 'input-list'" class="input-list-container">
              <div class="tags-container">
                <el-tag v-for="(item, idx) in (Array.isArray(field.value) ? field.value : [])" :key="idx" closable
                  class="input-list-tag" @close="removeListItem(field, idx)">
                  {{ item }}
                </el-tag>
              </div>
              <el-input v-model="field.inputValue" class="input-new-tag" :placeholder="field.placeholder"
                @keyup.enter="handleInputConfirm($event, field)" @blur="handleInputConfirm($event, field)" />
            </div>

            <!-- 日期时间范围 -->
            <el-date-picker v-else-if="field.type === 'dateTimeRange'" v-model="field.value" type="datetimerange"
              range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" :required="field.required" />

            <!-- 单个日期时间 -->
            <el-date-picker v-else-if="field.type === 'dateTime'" v-model="field.value" type="datetime"
              :placeholder="field.placeholder" :required="field.required" />

            <!-- 表格 -->
            <div v-else-if="field.type === 'table'" class="table-container">
              <el-table :data="field.value" border :style="{ width: '100%' }" class="custom-table">
                <el-table-column v-for="col in field.columns" :key="col.key" :prop="col.key" :label="col.title"
                  :min-width="getColumnWidth(col.type)">
                  <template #default="scope">
                    <!-- 表格内的输入框 -->
                    <el-input v-if="col.type === 'input'" v-model="scope.row[col.key]"
                      :placeholder="col.placeholder || `请输入${col.title}`" size="small" />
                    <!-- 表格内的复选框 -->
                    <el-checkbox v-else-if="col.type === 'checkbox'" v-model="scope.row[col.key]"
                      class="table-checkbox" />
                    <!-- 表格内的日期选择器 -->
                    <el-date-picker v-else-if="col.type === 'date'" v-model="scope.row[col.key]" type="date"
                      size="small" style="width: 100%" />
                    <!-- 表格内的时间选择器 -->
                    <el-time-picker v-else-if="col.type === 'time'" v-model="scope.row[col.key]" size="small"
                      style="width: 100%" />
                    <!-- 表格内的数字输入框 -->
                    <el-input-number v-else-if="col.type === 'number'" v-model="scope.row[col.key]" size="small"
                      :min="1" :max="31" style="width: 100%" />
                    <!-- 表格内的签名 -->
                    <div v-else-if="col.type === 'signature'" class="signature-field">
                      <el-input v-model="scope.row[col.key]" placeholder="请签名" size="small" />
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" v-if="field.allowDelete !== false">
                  <template #default="scope">
                    <el-button type="danger" link size="small" @click="removeTableRow(field, scope.$index)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-button type="primary" size="small" @click="addTableRow(field)" class="add-row-btn">
                添加行
              </el-button>
            </div>

            <!-- 签名字段 -->
            <template v-else-if="field.type === 'signature'" class="signature-container">
              <div class="signature-field">
                <template v-if="field.value">
                  <img :src=" imgBaseUrl + field.value" class="signature-image" alt="签名" />
                  <el-button type="primary" size="small" @click="openSignatureDialog(field)">
                    重新签名
                  </el-button>
                </template>
                <template v-else>
                  <div class="signature-placeholder">
                    <el-button type="primary" @click="openSignatureDialog(field)">
                      点击签名
                    </el-button>
                  </div>
                </template>
              </div>
            </template>

            <!-- 审核主管选择 -->
            <el-select v-else-if="field.type === 'auditor'" v-model="field.value" :placeholder="field.placeholder"
              :required="field.required" class="auditor-select">
              <el-option v-for="supervisor in supervisors" :key="supervisor.ID" :label="supervisor.nick_name" :value="JSON.stringify({
                id: supervisor.ID,
                name: supervisor.nick_name,
                type: 'auditor'
              })" />
            </el-select>
          </el-form-item>
        </template>
      </el-form>
    </el-drawer>

    <el-drawer destroy-on-close size="800" v-model="detailShow" :show-close="true" :before-close="closeDetailShow"
      title="查看">
      <div style="margin-bottom: 20px; padding: 15px; border-radius: 8px; background-color: #f5f7fa; border: 1px solid #e4e7ed;">
        <h3 style="margin-bottom: 15px; color: #606266; font-size: 16px; font-weight: bold;">工作流程</h3>
        <div style="width: 100%; overflow-x: auto; padding: 5px; background: white; border-radius: 4px; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);">
          <tiny-wizard 
            :data="flowDataSet" 
            :current-step="currentStepIndex"
            @node-click="flowNodeClick"
            style="width: 100%; min-height: 50px;"
            class="flow-wizard"

          ></tiny-wizard>
        </div>
        <!-- 流程步骤详情 -->
        <div v-if="selectedStepInfo" class="step-details-container">
          <div class="step-details-header">
            <span class="step-details-title">{{ selectedStepInfo.label }}</span>
            <div class="step-status-tags">
              <el-tag v-if="selectedStepInfo.isActive" type="success" size="small">当前步骤</el-tag>
              <el-tag v-if="selectedStepInfo.stepTypeLabel" type="primary" size="small" effect="plain">{{ selectedStepInfo.stepTypeLabel }}</el-tag>
              <!-- 移除状态标签，不再显示"待处理"等状态 -->
            </div>
          </div>

        </div>
      </div>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="当前状态">
        
          <el-tag :type="formatStatusForDetail(detailFrom.log).type">
            {{ formatStatusForDetail(detailFrom.log).text }}
          </el-tag>
        </el-descriptions-item>
    
        <el-descriptions-item label="内容">
          <div class="detail-content">
            <template v-if="parseValueData(detailFrom.value)">
              <div v-for="(field, index) in parseValueData(detailFrom.value)" :key="index" class="detail-field">
                <div class="field-header">{{ field.name }}</div>
                <div class="field-content">
                  <!-- 表格类型 -->
                  <template v-if="field.type === 'table'">
                    <el-table :data="field.value" border size="small" style="width: 100%">
                      <el-table-column v-for="col in field.columns" :key="col.key" :prop="col.key" :label="col.title"
                        :min-width="getColumnWidth(col.type)">
                        <template #default="scope">
                          <template v-if="col.type === 'checkbox'">
                            <el-tag :type="scope.row[col.key] ? 'success' : 'info'" size="small">
                              {{ scope.row[col.key] ? '是' : '否' }}
                            </el-tag>
                          </template>
                          <template v-else>
                            {{ scope.row[col.key] || '-' }}
                          </template>
                        </template>
                      </el-table-column>
                    </el-table>
                  </template>

                  <!-- 输入列表类型 -->
                  <template v-else-if="field.type === 'input-list'">
                    <div class="input-list-display">
                      <el-tag v-for="(item, idx) in field.value" :key="idx" size="small" class="input-list-tag">
                        {{ item }}
                      </el-tag>
                    </div>
                  </template>

                  <!-- 日期时间范围类型 -->
                  <template v-else-if="field.type === 'dateTimeRange'">
                    <div class="datetime-range">
                      {{ formatDateTime(field.value.start) }} 至 {{ formatDateTime(field.value.end) }}
                    </div>
                  </template>

                  <!-- 审核主管类型 -->
                  <template v-else-if="field.type === 'auditor'">
                    <el-tag type="primary" size="small" effect="plain">
                      {{ field.value?.name || '-' }}
                    </el-tag>
                  </template>
                  <!-- 签名类型 -->
                  <template v-else-if="field.type === 'signature'">
                    <img :src=" imgBaseUrl + field.value" class="signature-image" alt="签名"
                      style="max-width: 200px; max-height: 100px; border: 1px solid #dcdfe6; border-radius: 2px; padding: 2px;" />
                  </template>
                  <!-- 文本类型（包括 textarea 和 input） -->
                  <template v-else>
                    <div class="text-content">{{ field.value || '-' }}</div>
                  </template>
                </div>
              </div>
            </template>
            <div v-else>无数据</div>
          </div>
        </el-descriptions-item>

        <!-- 日志部分保持不变 -->
        <el-descriptions-item label="填写日志">
          <div v-if="detailFrom.log" class="log-container">
            <el-timeline>
              <el-timeline-item v-for="(activity, index) in formatLogDisplay(detailFrom.log).history" :key="index"
                :timestamp="formatDateTime(activity.timestamp)" :type="getTimelineItemType(activity)">
                <div class="log-entry">
                  <div class="log-header">
                    <span class="user-name">{{ activity.userName }}</span>
                    <el-tag size="small" :type="getActionTagType(activity.action)">
                      {{ activity.action }}
                    </el-tag>
                  </div>
                  <div class="log-content" v-if="activity.content">
                    <template v-if="typeof activity.content === 'object'">
                      <!-- 处理表格类型数据 -->
                      <template v-if="activity.content.dailyLog">
                        <el-table :data="activity.content.dailyLog" border style="width: 100%">
                          <el-table-column prop="date" label="日期" width="180">
                            <template #default="scope">
                              {{ formatDateTime(scope.row.date) }}
                            </template>
                          </el-table-column>
                          <el-table-column prop="content" label="内容"/>
                          <el-table-column label="工作时间" width="300">
                            <template #default="scope">
                              {{ formatDateTime(scope.row.startTime) }} - {{ formatDateTime(scope.row.endTime) }}
                            </template>
                          </el-table-column>
                        </el-table>
                      </template>
                      
                      <!-- 处理安全措施表格 -->
                      <template v-else-if="activity.content.安全措施">
                        <el-table :data="activity.content.安全措施" border style="width: 100%">
                          <el-table-column prop="measure" label="安全措施"/>
                          <el-table-column prop="executed" label="是否执行" width="100">
                            <template #default="scope">
                              <el-tag :type="scope.row.executed ? 'success' : 'danger'">
                                {{ scope.row.executed ? '是' : '否' }}
                              </el-tag>
                            </template>
                          </el-table-column>
                        </el-table>
                      </template>
                      
                      <!-- 处理工作地点表格 -->
                      <template v-else-if="activity.content.工作地点及设备双重名称">
                        <el-table :data="activity.content.工作地点及设备双重名称" border style="width: 100%">
                          <el-table-column prop="location" label="工作地点"/>
                          <el-table-column prop="content" label="工作内容"/>
                        </el-table>
                      </template>
                      
                      <!-- 处理其他普通字段 -->
                      <template v-else>
                        <div v-for="(value, key) in activity.content" :key="key" class="log-field">
                          <span class="field-label">{{ key }}:</span>
                          <template v-if="(key.includes('签名') || key == 'signature') ">
                            <img :src=" imgBaseUrl + value" class="signature-image-small" alt="签名"/>
                          </template>
                          <template v-else-if="(key.includes('审核主管') || key === 'auditor')">
                            <el-tag type="primary" size="small" effect="plain">
                              {{ JSON.parse(value).name }}
                            </el-tag>
                          </template>
                          <span v-else class="field-value">{{ formatLogValue(value, key) }}</span>
                        </div>
                      </template>
                    </template>
                    <template v-else>
                      {{ activity.content }}
                    </template>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>

          </div>
          <span v-else>无日志记录</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-drawer>

    <el-dialog v-model="auditDialogVisible" title="审核工单" width="500px" destroy-on-close>
      <el-form ref="auditFormRef" :model="auditForm" label-width="100px">
        <el-form-item label="审核结果" required>
          <el-radio-group v-model="auditForm.approved">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见" required>
          <el-input v-model="auditForm.comment" type="textarea" rows="4" placeholder="请输入审核意见" />
        </el-form-item>
        <el-form-item label="审核签名" required>
          <div class="signature-field">
            <template v-if="auditForm.signature">
              <img :src=" imgBaseUrl + auditForm.signature" class="signature-image" alt="签名" />
              <el-button type="primary" size="small" @click="openSignatureDialog({
                value: auditForm.signature,
                setValue: (val) => auditForm.signature = val
              })">
                重新签名
              </el-button>
            </template>
            <template v-else>
              <div class="signature-placeholder">
                <el-button type="primary" @click="openSignatureDialog({
                  value: '',
                  setValue: (val) => auditForm.signature = val
                })">
                  点击签名
                </el-button>
              </div>
            </template>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="auditDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAudit" :loading="auditLoading">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 延期申请弹窗 -->
    <el-dialog v-model="workExecutionStatus.isExtending" title="延期申请" width="800px">
  <el-form ref="extensionFormRef" :model="extensionForm" :rules="extensionRules" label-width="100px">
    <el-form-item label="延期原因" prop="reason" required>
      <el-input v-model="extensionForm.reason" type="textarea" rows="3" placeholder="请输入延期原因" />
    </el-form-item>
    <el-form-item label="延期至" prop="extendDate" required>
      <el-date-picker v-model="extensionForm.extendDate" type="datetime" placeholder="选择延期日期" />
    </el-form-item>
    <el-form-item label="工作日志" prop="dailyLog" required>
      <el-table :data="extensionForm.dailyLog" border>
        <el-table-column label="日期" width="180">
          <template #default="{ row }">
            <el-date-picker v-model="row.date" type="datetime" placeholder="选择日期时间" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="120">
          <template #default="{ row }">
            <el-time-picker v-model="row.startTime" placeholder="开始时间" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="结束时间" width="120">
          <template #default="{ row }">
            <el-time-picker v-model="row.endTime" placeholder="结束时间" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="工作内容" min-width="200">
          <template #default="{ row }">
            <el-input v-model="row.content" type="textarea" rows="2" placeholder="请输入工作内容" />
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="80">
          <template #default="{ $index }">
            <el-button type="danger" link @click="extensionForm.dailyLog.splice($index, 1)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-button type="primary" link @click="addDailyLog">
        添加日志
      </el-button>
    </el-form-item>
  </el-form>
  <template #footer>
    <el-button @click="workExecutionStatus.isExtending = false">取消</el-button>
    <el-button type="primary" @click="submitExtension">提交</el-button>
  </template>
</el-dialog>



    <!-- 变更负责人弹窗 -->
    <el-dialog v-model="workExecutionStatus.isChangingResponsible" title="变更负责人" width="500px" destroy-on-close>
      <el-form ref="changeResponsibleFormRef" :model="changeResponsibleForm" label-width="100px">
        <el-form-item label="变更原因" required>
          <el-input v-model="changeResponsibleForm.reason" type="textarea" rows="4" placeholder="请输入变更原因" />
        </el-form-item>
        <el-form-item label="新负责人" required>
          <el-select v-model="changeResponsibleForm.newSupervisorId" placeholder="请选择新负责人">
            <el-option v-for="item in supervisors" :key="item.ID" :label="item.nick_name" :value="item.ID" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请人签名" required>
          <div class="signature-field">
            <template v-if="changeResponsibleForm.signature">
              <img :src=" imgBaseUrl + changeResponsibleForm.signature" class="signature-image" alt="签名" />
              <el-button type="primary" size="small" @click="openSignatureDialog({
                value: changeResponsibleForm.signature,
                setValue: (val) => changeResponsibleForm.signature = val
              })">
                重新签名
              </el-button>
            </template>
            <template v-else>
              <div class="signature-placeholder">
                <el-button type="primary" @click="openSignatureDialog({
                  value: '',
                  setValue: (val) => changeResponsibleForm.signature = val
                })">
                  点击签名
                </el-button>
              </div>
            </template>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="workExecutionStatus.isChangingResponsible = false">取消</el-button>
          <el-button type="primary" @click="submitChangeResponsible" :loading="changeResponsibleLoading">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 修改工作完成弹窗 -->
    <el-dialog v-model="workExecutionStatus.isCompleting" title="工作完成确认" width="500px" destroy-on-close>
      <el-form ref="completeFormRef" :model="completeForm" label-width="100px">
        <el-form-item label="完成说明" required>
          <el-input v-model="completeForm.comment" type="textarea" rows="4" placeholder="请输入完成说明" />
        </el-form-item>
        <el-form-item label="完成签名" required>
          <div class="signature-field">
            <template v-if="completeForm.signature">
              <img :src="completeForm.signature" class="signature-image" alt="签名" />
              <el-button type="primary" size="small" @click="openSignatureDialog({
                value: completeForm.signature,
                setValue: (val) => completeForm.signature = val
              })">
                重新签名
              </el-button>
            </template>
            <template v-else>
              <div class="signature-placeholder">
                <el-button type="primary" @click="openSignatureDialog({
                  value: '',
                  setValue: (val) => completeForm.signature = val
                })">
                  点击签名
                </el-button>
              </div>
            </template>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="workExecutionStatus.isCompleting = false">取消</el-button>
          <el-button type="primary" @click="submitComplete" :loading="completeLoading">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 修改签名弹窗组件 -->
    <el-dialog v-model="signatureDialogVisible" title="电子签名" width="600px" destroy-on-close>
      <div class="signature-dialog-content">
        <p class="signature-tip">请在下方区域签名</p>
        <div class="signature-canvas-container">
          <canvas ref="signatureCanvas" class="signature-canvas" @mousedown="startDrawing" @mousemove="draw"
            @mouseup="stopDrawing" @mouseleave="stopDrawing"></canvas>

        </div>
        <div class="signature-actions">
          <el-button @click="clearSignature">清除</el-button>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelSignature">取消</el-button>
          <el-button type="primary" @click="confirmSignature" :loading="signatureLoading">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加终结确认弹窗 -->
    <el-dialog v-model="completeConfirmDialogVisible" title="终结确认" width="500px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="确认签名" required>
          <div class="signature-field">
            <template v-if="completeConfirmForm.signature">
              <img :src="completeConfirmForm.signature" class="signature-image" alt="签名" />
              <el-button type="primary" size="small" @click="openSignatureDialog({
                value: completeConfirmForm.signature,
                setValue: (val) => completeConfirmForm.signature = val
              })">
                重新签名
              </el-button>
            </template>
            <template v-else>
              <div class="signature-placeholder">
                <el-button type="primary" @click="openSignatureDialog({
                  value: '',
                  setValue: (val) => completeConfirmForm.signature = val
                })">
                  点击签名
                </el-button>
              </div>
            </template>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="completeConfirmDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCompleteConfirm">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>

import {
  createThreeTicketExamples,
  deleteThreeTicketExamples,
  deleteThreeTicketExamplesByIds,
  updateThreeTicketExamples,
  findThreeTicketExamples,
  getThreeTicketExamplesList
} from '@/plugin/threeTicket/api/threeTicketExamples'
import { imgBaseUrl } from '@/config'
// 全量引入格式化工具 请按需保留
import { formatDate, formatBoolean, filterDataSource, returnArrImg, onDownloadFile } from '@/utils/format'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref, reactive, computed, onMounted, onUnmounted, h, nextTick, defineExpose, toRefs, watch } from 'vue'

import {
  createThreeTucjetTemplate,
  deleteThreeTucjetTemplate,
  deleteThreeTucjetTemplateByIds,
  updateThreeTucjetTemplate,
  findThreeTucjetTemplate,
  getThreeTucjetTemplateList
} from '@/plugin/threeTicket/api/threeTucjetTemplate'
import dayjs from 'dayjs'
// 引入 useUserStore
import { useUserStore } from '@/pinia/modules/user'
// 引入 TinyWizard 组件
import { TinyWizard } from '@opentiny/vue'
// const flowNodeClick = (node, index, event) => {
//   console.log('nodeClick', node, index, event)
// }
const flowDataSet = ref([])
// 添加当前选中行的引用
const currentRow = ref(null)

// 添加审核主管列表的引用

// 添加当前选中步骤信息
const selectedStepInfo = ref(null)

// 在组件挂载时获取审核主管列表
onMounted(() => {
  getSupervisors()
})

// 工作执行状态
const workExecutionStatus = ref({
  isExtending: false,
  isChangingResponsible: false,
  isCompleting: false
})

// 延期申请表单
const extensionForm = ref({
  reason: '',
  extendDate: null,
  dailyLog: []
});

// 变更负责人表单
const changeResponsibleForm = ref({
  reason: '',
  newSupervisorId: '',
  signature: '' // 添加签名字段
});

// 添加重置表的方法
const resetChangeResponsibleForm = () => {
  changeResponsibleForm.value = {
    reason: '',
    newSupervisorId: '',
    signature: ''
  };
};

// 获取用户信息
const userStore = useUserStore()
console.log('当前用户信息:', userStore.userInfo)

// 检查用户是否有审核权限
const hasAuditPermission = computed(() => {
  return userStore.userInfo.authorities?.some(auth => auth.authorityId === 8580)
})

// 如果需要在模板中使用，可以创建一个计算属性
const currentUser = computed(() => userStore.userInfo)

getThreeTucjetTemplateList().then(res => {
  console.log(res.data.list)
})

defineOptions({
  name: 'ThreeTicketExamples'
})

// 提交按钮loading
const btnLoading = ref(false)

// 控制更多查询条件显示/隐藏状态
const showAllQuery = ref(false)

// 自动化生成的字典（可能为空）以及字段
const formData = ref({
  value: {},
  log: {},
  templeId: '',
  applicantId: undefined,
  applicantName: '',
})







// 验证规则
const rule = reactive({
})

const searchRule = reactive({
  createdAt: [
    {
      validator: (rule, value, callback) => {
        if (searchInfo.value.startCreatedAt && !searchInfo.value.endCreatedAt) {
          callback(new Error('请填写结束日期'))
        } else if (!searchInfo.value.startCreatedAt && searchInfo.value.endCreatedAt) {
          callback(new Error('请填写开始日期'))
        } else if (searchInfo.value.startCreatedAt && searchInfo.value.endCreatedAt && (searchInfo.value.startCreatedAt.getTime() === searchInfo.value.endCreatedAt.getTime() || searchInfo.value.startCreatedAt.getTime() > searchInfo.value.endCreatedAt.getTime())) {
          callback(new Error('开始日期应当早于结束日期'))
        } else {
          callback()
        }
      }, trigger: 'change'
    }
  ],
})

const elFormRef = ref()
const elSearchFormRef = ref()

// =========== 表格控制部分 ===========
const page = ref(1)
const total = ref(0)
const pageSize = ref(10)
const tableData = ref([])
const originalData = ref([]) // 添加 originalData 的定义
const searchInfo = ref({})
// 重置
const onReset = () => {
  searchInfo.value = {}
  getTableData()
}

// 搜索
const onSubmit = () => {
  elSearchFormRef.value?.validate(async (valid) => {
    if (!valid) return
    page.value = 1
    getTableData()
  })
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  getTableData()
}

// 修改页面容量
const handleCurrentChange = (val) => {
  page.value = val
  getTableData()
}

// 添加未审核状态控制
const showUnaudited = ref(false)

// 修改切换按钮的处理函数
const toggleUnaudited = () => {
  showUnaudited.value = !showUnaudited.value;
  if (showUnaudited.value) {
    // 只显示待审核工单
    console.log('originalData.value:', originalData.value)
    tableData.value = originalData.value.filter(item => {
      console.log('item:', item.log.currentStepType)
      if(typeof item.log === 'string') {
        item.log = JSON.parse(item.log)
      }
      return item.log?.currentStepType === "complete_audit" || 
      item.log?.currentStepType === "audit"
    }
    );
  } else {
    // 显示所有工单
    tableData.value = originalData.value;
  }
};
// 修改查询函数，使用 fetch
const getTableData = async () => {
  try {
    // 构建查询参数
    const queryParams = {
      page: page.value,
      pageSize: pageSize.value,
      currentUserId: userStore.userInfo.ID,
      ...(showUnaudited.value && { status: 0 }),
      
      // 修改日期处理逻辑
      ...(searchInfo.value?.startCreatedAt && { 
        startCreatedAt: dayjs(searchInfo.value.startCreatedAt)
          .format('YYYY-MM-DD HH:mm:ss') // 直接使用选择的时间
      }),
      ...(searchInfo.value?.endCreatedAt && { 
        endCreatedAt: dayjs(searchInfo.value.endCreatedAt)
          .format('YYYY-MM-DD HH:mm:ss') // 直接使用选择的时间
      }),
      
      ...(searchInfo.value?.templeId && { templeId: searchInfo.value.templeId }),
      ...(searchInfo.value?.applicantName && { applicantName: searchInfo.value.applicantName })
    };

    // 添加详细的调试日志
    console.log('时间查询参数:', {
      原始时间范围: {
        开始: searchInfo.value?.startCreatedAt,
        结束: searchInfo.value?.endCreatedAt,
      },
      处理后时间范围: {
        开始: queryParams.startCreatedAt,
        结束: queryParams.endCreatedAt,
      },
      时区信息: {
        本地时区: Intl.DateTimeFormat().resolvedOptions().timeZone,
        时区偏移: new Date().getTimezoneOffset()
      }
    });

    const response = await fetch(`/express/template/list-all`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

    const result = await response.json();

    if (result.code === 0) {
      originalData.value = result.data.list; // 保存原始数据
      tableData.value = result.data.list;
      total.value = result.data.total;
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

getTableData()

// ============== 表格控制部分结束 ===============

// 获取需要的字典 可能为空 按需保留
// 注释掉字典相关函数，防止"字典未创建或未启用"的提示
/* 
const setOptions = async () => {
}

// 获取需要的字典 可能为空 按需保留
setOptions()
*/

// 多选数据
const multipleSelection = ref([])
// 多选
const handleSelectionChange = (val) => {
  multipleSelection.value = val
}

// 删除行
const deleteRow = (row) => {
  ElMessageBox.confirm('确定要删除吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteThreeTicketExamplesFunc(row)
  })
}

// 多选删除
const onDelete = async () => {
  ElMessageBox.confirm('确定删除吗?', '提示', {
    confirmButtonText: '确',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const IDs = []
    if (multipleSelection.value.length === 0) {
      ElMessage({
        type: 'warning',
        message: '请选择要删除的数据'
      })
      return
    }
    multipleSelection.value &&
      multipleSelection.value.map(item => {
        IDs.push(item.ID)
      })
    const res = await deleteThreeTicketExamplesByIds({ IDs })
    if (res.code === 0) {
      ElMessage({
        type: 'success',
        message: '删除成功'
      })
      if (tableData.value.length === IDs.length && page.value > 1) {
        page.value--
      }
      getTableData()
    }
  })
}

// 行为控制标记（弹窗内部需要增还是改）
const type = ref('')

// 更新行
const updateThreeTicketExamplesFunc = async (row) => {
  const res = await findThreeTicketExamples({ ID: row.ID })
  type.value = 'update'
  if (res.code === 0) {
    // 打印更新时的数据
    console.log('更新数据:', {
      ...res.data,
      parsedValue: res.data.value ? JSON.parse(res.data.value) : null,
      parsedLog: res.data.log ? formatLogForConsole(res.data.log) : null
    })

    formData.value = res.data
    dialogFormVisible.value = true
  }
}


// 删除行
const deleteThreeTicketExamplesFunc = async (row) => {
  const res = await deleteThreeTicketExamples({ ID: row.ID })
  if (res.code === 0) {
    ElMessage({
      type: 'success',
      message: '删除成功'
    })
    if (tableData.value.length === 1 && page.value > 1) {
      page.value--
    }
    getTableData()
  }
}

// 弹窗控制标记
const dialogFormVisible = ref(false)

// 修改打开弹窗函数
const openDialog = () => {
  type.value = 'create'
  // 重置表单数据
  formData.value = {
    value: {},
    log: {},
    templeId: '',
    applicantId: undefined,
    applicantName: '',
  }
  // 重置模板字段
  selectedTemplateId.value = null
  selectedTemplateFields.value = []
  // 重置所有表格和列表数据
  if (elFormRef.value) {
    elFormRef.value.resetFields()
  }
  dialogFormVisible.value = true
}

// 关闭弹窗
const closeDialog = () => {
  dialogFormVisible.value = false
  formData.value = {
    value: {},
    log: {},
    templeId: '',
    applicantId: undefined,
    applicantName: '',
  }
}
// 弹窗确定
const enterDialog = async () => {
  btnLoading.value = true
  elFormRef.value?.validate(async (valid) => {
    if (!valid) return (btnLoading.value = false)

    // 获取当前选中的模板
    const selectedTemplate = templates.value.find(t => t.ID === selectedTemplateId.value)
    if (!selectedTemplate) {
      ElMessage.error('未找到选中的模板')
      btnLoading.value = false
      return
    }

    // 验证所有必填字段
    const invalidFields = selectedTemplateFields.value.filter(field => {
      if (!field.required) return false

      // 根据字段类型进行验证
      switch (field.type) {
        case 'input':
        case 'textarea':
          return !field.value || !field.value.trim()
        case 'table':
          return !Array.isArray(field.value) || field.value.length === 0
        case 'input-list':
          return !Array.isArray(field.value) || field.value.length === 0
        case 'dateTimeRange':
          return !Array.isArray(field.value) || field.value.length !== 2 || !field.value[0] || !field.value[1]
        case 'signature':
          // 修改签名验证逻辑，同时支持 base64 和文件路径格式
          return !field.value || 
            !(field.value.startsWith('data:image') || 
            field.value.includes('/work/')) // 支持完整 URL 格式
        case 'auditor':
          return !field.value
        default:
          return !field.value
      }
    })
    // 如果有未填写的必填字段，显示错误信息
    if (invalidFields.length > 0) {
      const fieldNames = invalidFields.map(f => f.name).join('、')
      console.log('invalidFields', invalidFields)
      ElMessage({
        type: 'error',
        message: `以下字段为必填项，请完整填写：${fieldNames}`
      })
      btnLoading.value = false
      return
    }

    // 构建表单数据
    const formDataJson = selectedTemplateFields.value.reduce((acc, field) => {
      if (field.type === 'checkbox') {
        acc[field.name] = !!field.value
      } else {
        acc[field.name] = field.value
      }
      return acc
    }, {})

    try {
      // 准备要保存的数据
      const saveData = {
        templateData: formDataJson,
        templateInfo: {
          id: selectedTemplate.ID,
          name: selectedTemplate.name,
          fields: selectedTemplateFields.value.map(field => ({
            name: field.name,
            type: field.type,
            required: field.required,
            placeholder: field.placeholder,
            columns: field.columns // 如果是表格类型
          }))
        }
      }

      // 准备日志数据
      const currentLog = {
        content: formDataJson,
        currentStepIndex: 0,
        currentStepType: 'audit',
        history: []
      }

      // 如果是更新操作，保留之前的历史记录
      if (type.value === 'update' && formData.value.log) {
        try {
          const previousLog = JSON.parse(formData.value.log)
          if (previousLog.history) {
            currentLog.history = previousLog.history
          }
        } catch (e) {
          console.warn('无法解析之前的日志记录')
        }
      }

      // 添加新的操作记录
      currentLog.history.push(
        createLogEntry(
          type.value === 'create' ? '创建' : '更新',
          formDataJson,
          userStore.userInfo,
          {
            stepIndex: currentLog.currentStepIndex,
            stepType: 'audit',
            stepName: type.value === 'create' ? '创建' : '更新',
            result: '提交审核'
          }
        )
      )

      // 更新表单数据
      formData.value = {
        ...formData.value,
        templeId: String(selectedTemplateId.value),
        applicantId: userStore.userInfo.ID,
        applicantName: userStore.userInfo.nickName,
        value: JSON.stringify(saveData),
        log: JSON.stringify(currentLog)
      }
    } catch (error) {
      console.error('处理数据时出错:', error)
      ElMessage({
        type: 'error',
        message: '数据格式错误'
      })
      btnLoading.value = false
      return
    }

    let res
    switch (type.value) {
      case 'create':
        console.log('formData.value:', formData.value)
        res = await createThreeTicketExamples(formData.value)
        break
      case 'update':
        res = await updateThreeTicketExamples(formData.value)
        break
      default:
        res = await createThreeTicketExamples(formData.value)
        break
    }
    btnLoading.value = false
    if (res.code === 0) {
      ElMessage({
        type: 'success',
        message: '创建/更改成功'
      })
      closeDialog()
      getTableData()
    }
  })
}


const detailFrom = ref({})

// 查看详情控制��记
const detailShow = ref(false)


// 打开详情弹窗
const openDetailShow = () => {
  detailShow.value = true
   initDefaultFlowData()
}


// 打开详情
const getDetails = async (row) => {
  try {
    const res = await findThreeTicketExamples({ ID: row.ID });
    console.log(res.data)
    if (res.code === 0) {
      // 处理返回的数据
      const detailData = {
        ...res.data,
        value: typeof res.data.value === 'string' ? JSON.parse(res.data.value) : res.data.value,
        log: typeof res.data.log === 'string' ? JSON.parse(res.data.log) : res.data.log
      };
      console.log('detailData:', detailData)
      detailFrom.value = detailData;
      localStorage.setItem("detailFrom_Val_z",JSON.stringify(detailData))
      openDetailShow();
    }
  } catch (e) {
    console.error('获取��情失��:', e);
    ElMessage.error('获取详情失败');
  }
};


// 关闭详情弹窗
const closeDetailShow = () => {
  detailShow.value = false
  detailFrom.value = {}
}

// 中间变量用于存储输入框的值
const inputValue = ref(JSON.stringify(formData.value, null, 2))
const logInputValue = ref(JSON.stringify(formData.log, null, 2))

// 初始化时将 formData.value 和 formData.log 转换为字符串
inputValue.value = JSON.stringify(formData.value, null, 2)
logInputValue.value = JSON.stringify(formData.log, null, 2)

const templates = ref([]) // 存储模板列表
const selectedTemplateId = ref(null) // 存储选择的模板ID
const selectedTemplateFields = ref([]) // 存储选择的模板的字段

// 获取模板列表
getThreeTucjetTemplateList().then(res => {
  templates.value = res.data.list
})

// 添加主管列表状态
const supervisors = ref([])

// 获取主管���表���函数
const getSupervisors = async () => {
  try {
    const response = await fetch('/express/template/users?authorityId=8580')
    const data = await response.json()
    if (data.code === 0) {
      supervisors.value = data.data.list.map(supervisor => ({
        ID: supervisor.id,
        nick_name: supervisor.nick_name,
        // 其他需要���属性...
      }))
      console.log('处理后的主管列表:', supervisors.value)
    } else {
      console.error('获取主管列表失败:', data.message)
    }
  } catch (error) {
    console.error('获取主管列表失败:', error)
  }
}

// 修改模板选择函数
const onTemplateChange = async (templateId) => {
  try {
    console.log('选择的模板ID:', templateId)
    const selectedTemplate = templates.value.find(template => template.ID === templateId)

    if (!selectedTemplate) {
      console.error('未找到选中的模板')
      return
    }

    console.log('原始模板数据:', selectedTemplate)

    // 处理多层嵌套的value
    let templateValue
    try {
      // 处理可能的字符串格式
      const parsedValue = typeof selectedTemplate.value === 'string'
        ? JSON.parse(selectedTemplate.value)
        : selectedTemplate.value

      // 获取真正的模板数组
      templateValue = parsedValue.value || []

      console.log('解析后的templateValue:', templateValue)

      if (!Array.isArray(templateValue)) {
        throw new Error('模板值不是数组格式')
      }

    } catch (e) {
      console.error('模板值解析失败:', e)
      return
    }

    // 获取初始化步骤
    const initStep = templateValue.find(step => step.name === '初始化')
    console.log('找到的初始化步骤:', initStep)

    if (!initStep || !Array.isArray(initStep.value)) {
      console.error('初始化步骤无效:', initStep)
      return
    }

    // 确保在设置字段之前已经获取到主管列表
    if (!supervisors.value?.length) {
      await getSupervisors()
    }

    // 初始化字段值
    selectedTemplateFields.value = initStep.value.map(field => {
      console.log('处理字段:', field)
      let initialValue
      switch (field.type) {
        case 'table':
          initialValue = Array.isArray(field.value) ? [...field.value] : []
          break
        case 'input-list':
          initialValue = Array.isArray(field.value) ? [...field.value] : []
          break
        case 'dateTimeRange':
          initialValue = field.value || {
            start: '',
            end: ''
          }
          break
        case 'auditor':
          // 确���审核主管字段正确初始化
          initialValue = ''
          break
        default:
          initialValue = field.value || ''
      }

      return {
        ...field,
        value: initialValue,
        inputValue: '' // 为 input-list 类型添加
      }
    })

    formData.value.templeId = String(selectedTemplate.ID)
    console.log('最终处���的字段:', selectedTemplateFields.value)

  } catch (error) {
    console.error('模板选择处理失败:', error)
    ElMessage.error('模板加载失败，请检查模板格式')
  }
}

// 修改获取模板列表的处理
const getTemplates = async () => {
  try {
    const res = await getThreeTucjetTemplateList()
    if (res.code === 0 && Array.isArray(res.data.list)) {
      templates.value = res.data.list.map(template => {
        try {
          // 确保 value 字段被正确解析
          if (typeof template.value === 'string') {
            const parsedValue = JSON.parse(template.value)
            return {
              ...template,
              value: parsedValue
            }
          }
          return template
        } catch (e) {
          console.error(`模板 ${template.ID} 解析失败:`, e)
          return template
        }
      })
      console.log('处理后的模板列表:', templates.value)
    }
  } catch (error) {
    console.error('获取模板列表失败:', error)
    ElMessage.error('获取模板列表失败')
  }
}

// 格式化内容显示
const formatContentDisplay = (content) => {
  const formattedContent = {}

  Object.entries(content).forEach(([key, value]) => {
    if (key === '开票人' || key === '审核主管') {
      try {
        const personInfo = typeof value === 'string' ? JSON.parse(value) : value;
        formattedContent[key] = personInfo.name || value;
      } catch (e) {
        formattedContent[key] = value;
      }
    } else if (typeof value === 'boolean' || value === 'true' || value === 'false') {
      formattedContent[key] = value === 'true' ? true : (value === 'false' ? false : value)
    } else {
      formattedContent[key] = value
    }
  })

  return formattedContent
}

// 修改 parseValueData 函数
const parseValueData = (value) => {
  try {
    let data = value;
    if (typeof value === 'string') {
      try {
        data = JSON.parse(value);
      } catch (e) {
        console.error('JSON解析失败，尝试直接使用数据');
      }
    }

    // 获取模板数据和信息
    const templateData = data?.templateData || {};
    const templateInfo = data?.templateInfo;

    if (templateInfo?.fields) {
      return templateInfo.fields.map(field => {
        const fieldValue = templateData[field.name];

        // 根据不同字段类型处理数据
        switch (field.type) {
          case 'signature':
            return {
              name: field.name,
              value: fieldValue,  // 保持原始base64数据
              type: 'signature',
              isImage: true  // 添加标记表示这是图片数据
            };


          case 'table':
            return {
              name: field.name,
              value: Array.isArray(fieldValue) ? fieldValue : [],
              type: 'table',
              columns: field.columns
            };

          case 'input-list':
            return {
              name: field.name,
              value: Array.isArray(fieldValue) ? fieldValue : [],
              type: 'input-list'
            };

          case 'dateTimeRange':
            if (Array.isArray(fieldValue) && fieldValue.length === 2) {
              return {
                name: field.name,
                value: {
                  start: fieldValue[0],
                  end: fieldValue[1]
                },
                type: 'dateTimeRange'
              };
            }
            return {
              name: field.name,
              value: { start: '', end: '' },
              type: 'dateTimeRange'
            };

          case 'auditor':
            let auditorValue;
            try {
              auditorValue = typeof fieldValue === 'string' ? JSON.parse(fieldValue) : fieldValue;
            } catch (e) {
              auditorValue = fieldValue;
            }
            return {
              name: field.name,
              value: auditorValue,
              type: 'auditor'
            };

          case 'textarea':
          case 'input':
          default:
            return {
              name: field.name,
              value: fieldValue || '',
              type: field.type || 'input'
            };
        }
      });
    }
    return null;
  } catch (error) {
    console.error('解析数据失败:', error);
    return null;
  }
};

// 修改日志创建函数，添加工作流状态信息
const createLogEntry = (action, content, user, flowState) => {
  return {
    timestamp: new Date().toISOString(),
    action: action,
    content: content,
    userId: user.ID,
    userName: user.nickName,
    flowState: flowState  // 添加流状态信息
  }
}

// 修改日志显示格式化���数
const formatLogDisplay = (log) => {
  try {
    // 如果 log 已经是对象，��接使用
    const logData = typeof log === 'string' ? JSON.parse(log) : log;
    if (!logData) return '无日志记录';

    return {
      currentContent: logData.content,
      currentStepIndex: logData.currentStepIndex,
      currentStepType: logData.currentStepType,
      history: logData.history?.map(entry => ({
        ...entry,
        // 确保 action 字段存在
        action: entry.action || (entry.flowState?.stepType === 'recall' ? '退回重填' : '未知操作'),
        timestamp: formatDate(new Date(entry.timestamp)),
        flowState: {
          ...entry.flowState,
          stepTypeLabel: entry.flowState?.stepType === 'audit' ? '审核' : '填写'
        }
      })) || []
    };
  } catch (e) {
    console.error('日志解析失败:', e);
    return '日志格式错误';
  }
};

// 添加一个工具函数用于格式化日志显示
const formatLogForConsole = (log) => {
  try {
    const logData = typeof log === 'string' ? JSON.parse(log) : log;
    if (!logData) return '无法解析��志数据';

    return {
      currentStep: {
        index: logData.currentStepIndex,
        type: logData.currentStepType
      },
      content: logData.content,
      history: logData.history?.map(entry => ({
        timestamp: formatDate(new Date(entry.timestamp)),
        action: entry.action,
        user: `${entry.userName}(${entry.userId})`,
        flowState: entry.flowState,
        content: entry.content
      }))
    };
  } catch (e) {
    console.error('格式化日志失败:', e);
    return '无法解析日志数据';
  }
};

// 添加判断是否可以新开票的方法
const canCreateNew = (row) => {
  try {
    const log = typeof row.log === 'string' ? JSON.parse(row.log) : row.log;
    if (!log) return false;

    // 只有已完成或被拒绝的票可以新开
    return ['success', 'reject'].includes(log.currentStepType);
  } catch (e) {
    console.error('检查新开权限失败:', e);
    return false;
  }
};

// 添加新开票的方法
const createNewFromExisting = async (row) => {
  try {
    // 解析原始数据
    const originalValue = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
    const templateData = originalValue.templateData;
    const templateInfo = originalValue.templateInfo;

    // 设置模板ID
    selectedTemplateId.value = templateInfo.id;
    
    // 等待模板字段加载
    await onTemplateChange(templateInfo.id);

    // 回填数据，但排除特定字段
    selectedTemplateFields.value = selectedTemplateFields.value.map(field => {
      const originalFieldValue = templateData[field.name];
      
      // 不回填的字段类型列表
      const excludedTypes = ['signature'];
      // 不回填的字段名称列表
      const excludedNames = ['审核意见', '审核结果', '完成说明'];
      
      // 如果字段类型或名称在排除列表中，返回空值
      if (excludedTypes.includes(field.type) || excludedNames.includes(field.name)) {
        return {
          ...field,
          value: field.type === 'table' ? [] : ''
        };
      }

      // 特殊处理审核主管字段
      if (field.type === 'auditor') {
        // 如果原始数据中有审核主管信息，尝试解析并回填
        if (originalFieldValue) {
          try {
            const auditorInfo = typeof originalFieldValue === 'string' 
              ? JSON.parse(originalFieldValue) 
              : originalFieldValue;
            
            return {
              ...field,
              value: JSON.stringify({
                id: auditorInfo.id,
                name: auditorInfo.name,
                type: 'auditor'
              })
            };
          } catch (e) {
            console.error('解析审核主管数据失败:', e);
            return { ...field, value: '' };
          }
        }
        return { ...field, value: '' };
      }

      // 回填其他字段的值
      return {
        ...field,
        value: originalFieldValue
      };
    });

    // 打开新建对话框
    type.value = 'create';
    dialogFormVisible.value = true;

  } catch (error) {
    console.error('新开票据失败:', error);
    ElMessage.error('新开票据失败，请重试');
  }
};

// 添加审核弹窗
const auditDialogVisible = ref(false)
const auditLoading = ref(false)
const auditForm = ref({
  approved: null,
  comment: '',
  signature: '' // 添加签名字段
})

const currentAuditTicket = ref(null)

// 判断是否可以审核工单
const canAudit = (row) => {
  try {
    // 只有有审核权限的人可以审核
    if (!hasAuditPermission.value) {
      return false;
    }

    const log = typeof row.log === 'string' ? JSON.parse(row.log) : row.log;
    if (!log) return false;

    // 检查是否是待审核状态
    if (log.currentStepType !== 'audit') {
      return false;
    }

    // 检查是否是指定的审核人
    const value = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
    if (!value?.templateData?.审核主管) return false;

    const supervisorInfo = typeof value.templateData.审核主管 === 'string'
      ? JSON.parse(value.templateData.审核主管)
      : value.templateData.审核主管;

    return supervisorInfo.id === userStore.userInfo.ID.toString();
  } catch (e) {
    console.error('解析工单数据失败:', e);
    return false;
  }
};

// 打开审核弹窗
const openAuditDialog = (row) => {
  currentAuditTicket.value = row
  auditForm.value = {
    approved: true,
    comment: ''
  }
  auditDialogVisible.value = true
}

// 修改提交审核函
const submitAudit = async () => {
  if (auditForm.value.approved === null) {
    ElMessage.warning('请选择审核结果')
    return
  }
  if (!auditForm.value.comment.trim()) {
    ElMessage.warning('请输入审核意见')
    return
  }
  if (!auditForm.value.signature) {
    ElMessage.warning('请完成签名')
    return
  }
  auditLoading.value = true
  try {
    const ticket = currentAuditTicket.value
    const template = templates.value.find(t => t.ID === parseInt(ticket.templeId))

    // 添加调试日志
    console.log('Template:', template)
    console.log('Template value:', template.value)

    // 解析模板值
    let templateValue
    try {
      templateValue = typeof template.value === 'string' ?
        JSON.parse(template.value) : template.value
    } catch (e) {
      console.error('解析模板值失败:', e)
      throw new Error('模板格式错误')
    }

    // 获取工作流程定义
    const workflow = templateValue.value || []
    console.log('workflow', workflow)
    // 找到当前审核步骤
    const currentStep = workflow.find(step => step.type === 'audit')

    if (!currentStep) {
      throw new Error('未找到审核步骤配置')
    }

    console.log('找到的审核步骤:', currentStep)

    const res = await fetch('/express/template/audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ID: ticket.ID,
        approved: auditForm.value.approved,
        nextIndex: auditForm.value.approved ? currentStep.next_step : currentStep.no_index,
        noIndex: currentStep.no_index,
        auditContent: {
          result: auditForm.value.approved ? '通过' : '不通过',
          comment: auditForm.value.comment,
          signature: auditForm.value.signature // 添加签名图片地址
        },
        auditorId: userStore.userInfo.ID,
        auditorName: userStore.userInfo.nickName,
        comment: auditForm.value.comment
      })
    }).then(res => res.json())

    if (res.code === 0) {
      ElMessage.success('审核操作成功')
      auditDialogVisible.value = false
      getTableData()
    } else {
      throw new Error(res.message || '审核失败')
    }
  } catch (error) {
    console.error('审核失败:', error)
    ElMessage.error(error.message || '审核失败')
  } finally {
    auditLoading.value = false
  }
}

// 获取工单状态文本
const getStatusText = (row) => {
  try {
    const log = typeof row.log === 'string' ? JSON.parse(row.log) : row.log;

    switch (log.currentStepType) {
      case 'audit':
        return '审核中';
      case 'input':
        return '工作执行中';
      case 'change_responsible':
        return '变更负责人审核中';
      case 'complete_audit':
        return '终结审核中';
      case 'reject':  // 添加reject状态
        return '未通过';
      case 'success':
        return '已完成';
      case 'void':
        return '已作废';
      default:
        return '未知状态';
    }
  } catch (e) {
    console.error('获取状态失败:', e);
    return '未知状态';
  }
};

// 获取状态标签类型
const getStatusType = (row) => {
  try {
    const log = typeof row.log === 'string' ? JSON.parse(row.log) : row.log;

    switch (log.currentStepType) {
      case 'audit':
        return 'warning';
      case 'input':
        return '';
      case 'change_responsible':
        return 'warning';
      case 'complete_audit':
        return 'warning';
      case 'reject':  // 添加reject状态
        return 'danger';
      case 'success':
        return 'success';
      case 'void':
        return 'danger';
      default:
        return 'info';
    }
  } catch (e) {
    return 'info';
  }
};

// 获取状态标签效果
const getStatusEffect = (row) => {
  try {
    const log = typeof row.log === 'string' ? JSON.parse(row.log) : row.log;
    if (!log) return 'light';

    // 如果是待审核状态，使用 plain 效果使其更醒目
    return log.currentStepType === 'audit' ? 'plain' : 'light';
  } catch (e) {
    return 'light';
  }
};

// 修改详情中的状态格式化函数
const formatStatusForDetail = (log) => {
  try {
    const logData = typeof log === 'string' ? JSON.parse(log) : log;
    if (!logData) return {
      text: '未知状态',
      type: 'info'
    };

    // 先检查当前步骤类型
    switch (logData.currentStepType) {
      case 'recall':
        return {
          text: '待重新申请',
          type: 'warning'
        };
      case 'input':
        return {
          text: '待填写',
          type: 'info'
        };
      case 'complete_audit':
        return {
          text: '待审核',
          type: 'warning'
        };
      case 'reject':  // 添加reject状态
        return {
          text: '未通过',
          type: 'danger'
        };
      case 'success':
        return {
          text: '已完成',
          type: 'success'
        };
      case 'void':
        return {
          text: '已作废',
          type: 'danger'
        };
      case 'audit':
        return {
          text: '待审核',
          type: 'warning'
        };
      default:
        return {
          text: '未知状态',
          type: 'info'
        };
    }
  } catch (e) {
    console.error('格式化状态失败:', e);
    return {
      text: '未知状态',
      type: 'info'
    };
  }
};

// 获取时间线项目的类型
const getTimelineItemType = (activity) => {
  try {
    // 添加严格的空值检查
    if (!activity) return 'primary'
    const action = activity.action || activity.flowState?.stepType
    if (!action) return 'primary'

    // 根据 action 或 stepType 判断类型
    if (action === 'recall' || action === '退回重填' || action === '申请人撤回') return 'warning'
    if (action.includes('审核通过') || action === 'success') return 'success'
    if (action.includes('审核不通过') || action === 'reject') return 'danger'
    if (action.includes('审核') || action === 'audit') return 'warning'
    return 'primary'
  } catch (e) {
    console.error('获取时间线类型失败:', e)
    return 'primary'
  }
}

// 获取操作标签的类型
const getActionTagType = (action) => {
  try {
    if (!action) return 'info'
    action = String(action)

    // 增加对退回操作的处理
    if (action === 'recall' || action === '退回重填' || action === '申请人撤回') return 'warning'
    if (action.includes('审核通过')) return 'success'
    if (action.includes('审核不通过')) return 'danger'
    if (action.includes('审核')) return 'warning'
    if (action === '创建') return 'primary'
    return 'info'
  } catch (e) {
    console.error('获取操作标签类型失败:', e)
    return 'info'
  }
}

// 判断是否可以退回工单
const canRecall = (row) => {
  try {
    // 检查是否是创建人
    const isCreator = String(row.applicantId) === String(userStore.userInfo.ID);
    if (!isCreator) {
      return false;
    }

    // 检查工单状态
    const log = typeof row.log === 'string' ? JSON.parse(row.log) : row.log;
    if (!log) return false;

    // 只有在待审核状态，且没有被退回或撤回时可以退回
    const isAuditStatus = log.currentStepType === 'audit';
    const lastHistory = log.history?.[log.history.length - 1];
    const notAlreadyRecalled = !lastHistory?.action?.includes('退回') &&
      !lastHistory?.action?.includes('撤回');

    return isAuditStatus && notAlreadyRecalled;
  } catch (e) {
    console.error('检查退回权限失败:', e);
    return false;
  }
};

// 确认退回操作
const confirmRecall = (row) => {
  ElMessageBox.confirm(
    '确定退回此工单吗？退回后可以重新填写。',
    '退回确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    recallTicket(row);
  }).catch(() => {
    // 用户取消操作
  });
};

// 执行退回操作
const recallTicket = async (row) => {
  try {
    const res = await fetch('/express/template/audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ID: row.ID,
        approved: false,
        nextIndex: 0,
        noIndex: 0,
        auditContent: {
          result: '待重新申请',
          comment: '申请人主动退回重填'
        },
        auditorId: userStore.userInfo.ID,
        auditorName: userStore.userInfo.nickName,
        comment: '申请人主动退回重填',
        isRecall: true,
        action: '申请人撤回',
        currentStepType: 'recall'
      })
    }).then(res => res.json());

    if (res.code === 0) {
      ElMessage.success('工单已退回，可以重新填写');
      getTableData();
    } else {
      throw new Error(res.message || '退回失败');
    }
  } catch (error) {
    console.error('退回失败:', error);
    ElMessage.error(error.message || '退回失败');
  }
};

// 判断是否可以编辑工单
const canEdit = (row) => {
  try {
    // 只有创建人可以编辑
    if (row.applicantId !== userStore.userInfo.ID.toString()) {
      return false;
    }

    const log = typeof row.log === 'string' ? JSON.parse(row.log) : row.log;
    if (!log) return false;

    const lastHistory = log.history?.[log.history.length - 1];

    // 在以下情况可以编辑：
    // 1. 初始填写状态
    // 2. 退回重填状态
    // 3. 审核不��过状态
    return log.currentStepType === 'input' &&
      (!lastHistory ||
        lastHistory.action === '退回��填' ||
        lastHistory.action === '审核通过');
  } catch (e) {
    return false;
  }
};
// 取消签名
const cancelSignature = () => {
  // 关闭签名弹窗
  signatureDialogVisible.value = false
  // 清空画布
  clearSignature()
}
const canPrint = (row) => {
  try {
    const log = typeof row.log === 'string' ? JSON.parse(row.log) : row.log;
    if (!log) return false;

    // 只有通过审核的工单��以打印
    return log.currentStepType === 'success';
  } catch (e) {
    return false;
  }
};

const printTicket = (row) => {
  const printContent = generatePrintContent(row);

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>工作票打印</title>
        <style>
          body {
            font-family: SimSun, serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            color: #333;
          }
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #000;
          }
        .company-title {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 10px;
}

.print-title {
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
}
          
          .print-id {
            font-size: 16px;
            color: #666;
          }
          .print-info {
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
          }
          .info-item {
            margin-bottom: 12px;
            line-height: 1.6;
          }
          .info-label {
            font-weight: bold;
            display: inline-block;
            width: 120px;
            color: #333;
          }
          .print-content {
            margin-bottom: 30px;
          }
          .content-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #ddd;
          }
          .content-item {
            margin-bottom: 12px;
            padding: 8px 0;
            border-bottom: 1px dashed #eee;
          }
          .print-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #000;
          }
          .audit-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
          }
          @media print {
            .no-print {
              display: none;
            }
            body {
              padding: 0;
              margin: 20px;
            }
            @page {
              margin: 20mm;
            }
          }
        </style>
      </head>
      <body>
        ${printContent}
        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="
            padding: 8px 20px;
            margin: 0 10px;
            background-color: #409EFF;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">打印</button>
          <button onclick="window.close()" style="
            padding: 8px 20px;
            margin: 0 10px;
            background-color: #909399;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">关闭</button>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// 添加一个格式化时间的函数
const formatPrintDateTime = (dateStr) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
  } catch (e) {
    console.error('时间格式化失败:', e);
    return dateStr;
  }
};

// 修改 generatePrintContent 函数中的时间显示部分
// 修改生成打印内容的函数
const generatePrintContent = (row) => {
  try {
    const value = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
    const templateData = value?.templateData || {};
    const fields = value?.templateInfo?.fields || [];
    const log = typeof row.log === 'string' ? JSON.parse(row.log) : row.log;

    // 获取最后的审核记录
    const finalAudit = log?.history?.find(h => h.action === '终结审核通过');

    return `
      <div class="print-header">
           <div class="company-title">河北省电力公司电力科学研究院</div>
        <div class="print-title">${value.templateInfo.name || '工作票'}</div>
        <div class="print-id">编号：${row.ID}</div>
      </div>
      
      <div class="print-info">
        <div class="info-item">
          <span class="info-label">创建时间：</span>
          <span>${formatPrintDateTime(row.CreatedAt)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">申请人：</span>
          <span>${row.applicantName}</span>
        </div>
      </div>
      
      <div class="print-content">
        <div class="content-title">工作内容</div>
        ${fields.map(field => {
      const fieldValue = templateData[field.name];
      if (!fieldValue) return '';

      switch (field.type) {
        case 'input-list':
          return `
                <div class="content-item">
                  <span class="info-label">${field.name}：</span>
                  <span>${Array.isArray(fieldValue) ? fieldValue.join('、') : fieldValue}</span>
                </div>
              `;
        case 'signature':
          return `
                <div class="content-item">
                  <span class="info-label">${field.name}：</span>
                  <img src="${fieldValue}" style="max-width: 200px; max-height: 100px; vertical-align: middle;" alt="签名" />
                </div>
              `;
        case 'auditor':
          try {
            const auditor = typeof fieldValue === 'string' ? JSON.parse(fieldValue) : fieldValue;
            return `
                  <div class="content-item">
                    <span class="info-label">${field.name}：</span>
                    <span>${auditor.name || '-'}</span>
                  </div>
                `;
          } catch (e) {
            return `
                  <div class="content-item">
                    <span class="info-label">${field.name}：</span>
                    <span>${fieldValue || '-'}</span>
                  </div>
                `;
          }

        case 'table':
          if (!Array.isArray(fieldValue) || !fieldValue.length) return '';

          if (field.name === '工作地点及设备双重名称') {
            return `
                  <div class="content-item">
                    <span class="info-label">${field.name}：</span>
                    <div style="margin-left: 120px;">
                      ${fieldValue.map((item, index) => `
                        <div style="margin-bottom: 8px;">
                          ${index + 1}. ${item.location}（${item.content}）
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `;
          }

          if (field.name === '安全措施') {
            return `
                  <div class="content-item">
                    <span class="info-label">${field.name}：</span>
                    <div style="margin-left: 120px;">
                      ${fieldValue.map((item, index) => `
                        <div style="margin-bottom: 8px;">
                          ${index + 1}. ${item.measure}
                          <span style="margin-left: 20px; color: ${item.executed ? '#67C23A' : '#F56C6C'}">
                            ${item.executed ? '已执行' : '未执行'}
                          </span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `;
          }

          return `
                <div class="content-item">
                  <span class="info-label">${field.name}：</span>
                  <div style="margin-left: 120px;">
                    ${fieldValue.map((item, index) => `
                      <div style="margin-bottom: 8px;">
                        ${index + 1}. ${Object.entries(item)
              .map(([key, val]) => {
                const column = field.columns.find(col => col.key === key);
                if (!column) return null;
                return `${column.title}: ${val}`;
              })
              .filter(Boolean)
              .join(', ')}
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;

        case 'dateTimeRange':
          if (!Array.isArray(fieldValue) || fieldValue.length !== 2) return '';
          return `
                <div class="content-item">
                  <span class="info-label">${field.name}：</span>
                  <span>${formatPrintDateTime(fieldValue[0])} 至 ${formatPrintDateTime(fieldValue[1])}</span>
                </div>
              `;

        default:
          return `
                <div class="content-item">
                  <span class="info-label">${field.name}：</span>
                  <span>${fieldValue || '-'}</span>
                </div>
              `;
      }
    }).join('')}
      </div>
      
      <div class="print-content">
        <div class="content-title">审核信息</div>
        ${log.history.map(record => `
          <div class="content-item">
            <span class="info-label">${record.action}：</span>
            <span>${record.userName} - ${formatPrintDateTime(record.timestamp)}</span>
            ${record.content?.comment ? `
              <div style="margin-top: 8px; margin-left: 120px; color: #666;">
                备注：${record.content.comment}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      

      
      ${finalAudit ? `
        <div class="audit-info">
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">终结审核人：</span>
              <span>${finalAudit.userName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">审核时间：</span>
              <span>${formatPrintDateTime(finalAudit.timestamp)}</span>
            </div>
          </div>
          
          <!-- 添加审核人签名 -->
            ${finalAudit.content?.signature ? `
            <div class="signature-row">
              <span class="info-label">审核人签名：</span>
              <img src="${finalAudit.content.signature}" style="width: 100px; height: 50px;"/>
            </div>
          ` : ''}
        </div>
      ` : ''}
    `;
  } catch (error) {
    console.error('生成打印内容失败:', error);
    return '<div>生成打印内容失败</div>';
  }
};

// 添加新��方法
const addTableRow = (field) => {
  const newRow = field.columns.reduce((acc, col) => {
    acc[col.key] = col.type === 'checkbox' ? false : '';
    return acc;
  }, {});
  field.value = field.value || [];
  field.value.push(newRow);
};

const removeListItem = (field, index) => {
  if (!Array.isArray(field.value)) {
    field.value = field.value ? field.value.split(',').filter(Boolean) : [];
  }
  field.value.splice(index, 1);
};

const handleInputConfirm = (event, field) => {
  const value = event.target.value?.trim();
  if (value) {
    // 确保 field.value 始终是数组
    if (!Array.isArray(field.value)) {
      field.value = field.value ? field.value.split(',').filter(Boolean) : [];
    }
    field.value.push(value);
  }
  field.inputVisible = false;
  // 清空输入框
  if (event.target) {
    event.target.value = '';
  }
};

const showInput = (field) => {
  field.inputVisible = true;
};

// 添加获取宽的方法
const getColumnWidth = (type) => {
  switch (type) {
    case 'checkbox':
      return '80';
    case 'number':
      return '100';
    case 'date':
    case 'time':
      return '160';
    case 'signature':
      return '150'; // 调整签名列宽度
    case 'input':
    default:
      return '200';
  }
};

// 添加删除表格行的方法
const removeTableRow = (field, index) => {
  field.value.splice(index, 1);
};

// 确保在组件初始化时获取主管列表
onMounted(async () => {
  try {
    await Promise.all([
      getTemplates(),
      getSupervisors()
    ])
  } catch (error) {
    console.error('初始化数据失败:', error)
    ElMessage.error('初始化数据失败')
  }
})

onMounted(() => {
  const canvas = signatureCanvas.value
  if (canvas) {
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', stopDrawing, { passive: false })
  }
})
onUnmounted(() => {
  const canvas = signatureCanvas.value
  if (canvas) {
    canvas.removeEventListener('touchstart', handleTouchStart)
    canvas.removeEventListener('touchmove', handleTouchMove)
    canvas.removeEventListener('touchend', stopDrawing)
  }
})

// 添加辅助方法
const formatDateTime = (datetime) => {
  if (!datetime) return '-';
  return new Date(datetime).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 修改格式化日志内容的函数
const formatLogValue = (value, key = '') => {
  if (value === null || value === undefined) return '-';

  // 处理对象类型的值
  if (typeof value === 'object') {
    // 处理数组
    if (Array.isArray(value)) {
      return value.map(item => formatLogValue(item, key)).join('、');
    }

    // 处理日期范围
    if (value.start !== undefined && value.end !== undefined) {
      const start = value.start ? formatDateTime(value.start) : '-';
      const end = value.end ? formatDateTime(value.end) : '-';
      return `${start} 至 ${end}`;
    }

    // 处理审核主管信息
    if (value.type === 'auditor') {
      return value.name || '-';
    }

    // 处理工作地点及设备双重名称
    if (key.includes('工作地点及设备双重名称')) {
      return value.location ? `${value.location}${value.content ? ` - ${value.content}` : ''}` : '-';
    }

    // 处理安全措施
    if (key.includes('安全措施')) {
      return value.measure ?
        `${value.measure}${value.executed ? ' (已执行)' : ' (未执行)'}` :
        '-';
    }

    // 其他对象类型，尝试提取有意义的属性
    const meaningfulProps = ['name', 'value', 'text', 'label'];
    for (const prop of meaningfulProps) {
      if (value[prop] !== undefined) return value[prop];
    }

    // 如果没有特殊处理��将对象转换为可读的字符串
    return Object.entries(value)
      .filter(([k, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ') || '-';
  }

  // 处理布尔值
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }

  // 处理其他基本类型
  return value || '-';
};

// 添加一个格式化函数用于浮窗显示
const formatValueForPopover = (field) => {
  if (!field) return '-';

  switch (field.type) {
    case 'input-list':
      return Array.isArray(field.value) ? field.value.join('、') : '-';

    case 'auditor':
      try {
        const auditorValue = typeof field.value === 'string' ? JSON.parse(field.value) : field.value;
        return auditorValue?.name || '-';
      } catch (e) {
        return field.value || '-';
      }

    case 'dateTimeRange':
      if (Array.isArray(field.value)) {
        return `${formatDateTime(field.value[0])} 至 ${formatDateTime(field.value[1])}`;
      }
      return field.value?.start && field.value?.end
        ? `${formatDateTime(field.value.start)} 至 ${formatDateTime(field.value.end)}`
        : '-';

    case 'table':
      if (!Array.isArray(field.value) || field.value.length === 0) return '-';
      // 对于表格类型，返回简短摘要
      return `共 ${field.value.length} 条记录`;

    default:
      return field.value || '-';
  }
};

// 添加获取预览内容的方法
const getPreviewContent = (row) => {
  const data = parseValueData(row.value);
  if (!data || data.length === 0) return '无数据';

  // 获取前三个字段的简短描述
  const preview = data.slice(0, 3).map(field => {
    const value = formatValueForPopover(field);
    return `${field.name}: ${value}`;
  }).join(' | ');

  return data.length > 3 ? `${preview} ...` : preview;
};

// 判断节点类型
const isAuditStep = (step) => step.type === 'audit';

// 添加日志条目
const addDailyLog = () => {
  extensionForm.value.dailyLog.push({
    date: new Date(),
    startTime: null,
    endTime: null,
    content: '',
    responsiblePersonSign: ''
  })
}

// 添加延期表单验证规则
const extensionFormRef = ref(null)
const extensionRules = {
  reason: [
    { required: true, message: '请输入延期原因', trigger: 'blur' }
  ],
  extendDate: [
    { required: true, message: '请选择延期日期', trigger: 'change' }
  ]
}

// 处理延期申请
const handleExtension = (row) => {
  // 从最新的 history 记录中获取延期申请数据
  const latestExtension = row.log?.history
    ?.filter(record => record.action === "延期申请")
    ?.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  // 回填表单数据
  extensionForm.value = {
    reason: latestExtension?.content?.reason || '',
    extendDate: latestExtension?.content?.extendDate || null,
    dailyLog: latestExtension?.content?.dailyLog 
      ? [...latestExtension.content.dailyLog]  // 创建新数组避免引用
      : []
  }
  
  workExecutionStatus.value.isExtending = true
  currentRow.value = row
}

// 提交延期申请
const submitExtension = async () => {
  // 验证延期原因和日期
  if (!extensionForm.value.reason) {
    ElMessage.warning('请填写延期原因')
    return
  }
  if (!extensionForm.value.extendDate) {  // 改为 extendDate
    ElMessage.warning('请选择延期日期')
    return
  }

  // 验证工作日志
  if (!extensionForm.value.dailyLog.length) {
    ElMessage.warning('请至少添加一条工作日志')
    return
  }

  // 验证日志数据
  for (const log of extensionForm.value.dailyLog) {
    if (!log.date || !log.content) {
      ElMessage.warning('请填写完整的工作日志信息')
      return
    }
  }

  try {
    const res = await fetch('/express/template/extend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ID: currentRow.value.ID,
        userId: userStore.userInfo.ID,
        userName: userStore.userInfo.nickName,
        content: {
          reason: extensionForm.value.reason,
          extendDate: extensionForm.value.extendDate,  // 改为 extendDate
          dailyLog: extensionForm.value.dailyLog
        }
      })
    }).then(res => res.json())

    if (res.code === 0) {
      ElMessage.success('延期申请已提交')
      workExecutionStatus.value.isExtending = false
      getTableData()
    } else {
      throw new Error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(error.message || '保存失败')
  }
}


// 处理变更负责人
const handleChangeResponsible = (row) => {
  resetChangeResponsibleForm();
  workExecutionStatus.value.isChangingResponsible = true;
  currentRow.value = row;
}

// 修改提交变更负责人的方法
const submitChangeResponsible = async () => {
  if (!changeResponsibleForm.value.reason || !changeResponsibleForm.value.newSupervisorId) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  if (!changeResponsibleForm.value.signature) {
    ElMessage.warning('请完成签名');
    return;
  }

  try {
    // 先上传签名图片
    const signaturePath = SignaturePathGol.value; // 变更负责人123

    // 找到选中的主管信息
    const selectedSupervisor = supervisors.value.find(
      s => s.ID === changeResponsibleForm.value.newSupervisorId
    );

    if (!selectedSupervisor) {
      ElMessage.warning('无效的主管选择');
      return;
    }

    const res = await fetch('/express/template/change-responsible', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ID: currentRow.value.ID,
        userId: userStore.userInfo.ID,
        userName: userStore.userInfo.nickName,
        content: {
          reason: changeResponsibleForm.value.reason,
          signature: signaturePath, // 使用上传后的图片路径
          newSupervisor: {
            id: selectedSupervisor.ID,
            name: selectedSupervisor.nick_name,
            type: 'auditor'
          }
        }
      })
    }).then(res => res.json());

    if (res.code === 0) {
      ElMessage.success('负责人已变更');
      workExecutionStatus.value.isChangingResponsible = false;
      getTableData();
    } else {
      throw new Error(res.message || '变更负责人失败');
    }
  } catch (error) {
    console.error('变更负责人失败:', error);
    ElMessage.error(error.message || '变更负责人失败');
  }
};

// 修改工作执行阶段的操作按钮
const getWorkExecutionActions = (row) => {
  try {
    const log = typeof row.log === 'string' ? JSON.parse(row.log) : row.log;
    if (!log || log.currentStepType !== 'input' || log.currentStepIndex !== 2) {
      return [];
    }

    return [
      {
        name: '延期',
        type: 'extension',
        action: () => handleExtension(row)
      },
      {
        name: '变更负责人',
        type: 'change_responsible',
        action: () => handleChangeResponsible(row)
      },
      {
        name: '工作完成',
        type: 'complete',
        action: () => handleComplete(row)
      }
    ];
  } catch (e) {
    console.error('获取工作执行操作失败:', e);
    return [];
  }
};

// 添加工作执行阶段的处理函数
const handleComplete = async (row) => {
  try {
    const res = await fetch('/express/template/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ID: row.ID,
        userId: userStore.userInfo.ID,
        userName: userStore.userInfo.nickName
      })
    }).then(res => res.json());

    if (res.code === 0) {
      ElMessage.success('工作已完成');
      getTableData();
    } else {
      throw new Error(res.message || '标记完成失败');
    }
  } catch (error) {
    console.error('标记完成失败:', error);
    ElMessage.error(error.message || '标记完成失败');
  }
}

// 判断是否处于工作执行阶段
const isWorkExecutionPhase = (row) => {
  try {
    const log = typeof row.log === 'string' ? JSON.parse(row.log) : row.log
    return log?.currentStepIndex === 2 && log?.currentStepType === 'input'
  } catch (e) {
    return false
  }
}
const getAuditActions = (row) => {
  try {
    // console.log('row:', row)
    if (!row || !row.log) {
      return [];
    }
    const log = typeof row.log === 'string' ? JSON.parse(row.log) : row.log;
    const currentUser = userStore.userInfo;

    // 检查是否是变更负责人的审核状态
    if (log.currentStepType === 'change_responsible' && log.currentStepIndex === 4) {
      const supervisorStr = row.value?.templateData?.审核主管;
      if (!supervisorStr) return [];

      const supervisor = typeof supervisorStr === 'string' ? JSON.parse(supervisorStr) : supervisorStr;
      if (String(currentUser.ID) === String(supervisor.id)) {
        return [
          {
            name: '同意变更',
            type: 'success',
            action: () => handleApproveChange(row, true)
          },
          {
            name: '拒绝变更',
            type: 'danger',
            action: () => handleApproveChange(row, false)
          }
        ];
      }
    }

    // 检查是否是终结审核状态
    if (log.currentStepType === 'complete_audit' && log.currentStepIndex === 6) {
      const supervisorStr = row.value?.templateData?.审核主管;
      if (!supervisorStr) return [];

      const supervisor = typeof supervisorStr === 'string' ? JSON.parse(supervisorStr) : supervisorStr;
      if (String(currentUser.ID) === String(supervisor.id)) {
        return [
          {
            name: '同意终结',
            type: 'success',
            action: () => openCompleteConfirmDialog(row, true)
          },
          {
            name: '拒绝终结',
            type: 'danger',
            action: () => handleCompleteAudit(row, false)
          }
        ];
      }
    }

    return [];
  } catch (e) {
    console.error('获取审核按钮失败:', e);
    return [];
  }
};

// 添加审核处理函数
const handleApproveChange = async (row, isApproved) => {
  try {
    const res = await fetch('/express/template/approve-change', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ID: row.ID,
        userId: userStore.userInfo.ID,
        userName: userStore.userInfo.nickName,
        content: {
          result: isApproved ? '通过' : '拒绝',
          comment: '',
          newSupervisor: isApproved ? JSON.parse(row.value.templateData.审核主管) : null
        }
      })
    }).then(res => res.json());

    if (res.code === 0) {
      ElMessage.success(isApproved ? '已同意变更' : '已拒绝变更');
      getTableData();
    } else {
      throw new Error(res.message || '审核失败');
    }
  } catch (error) {
    console.error('审核失败:', error);
    ElMessage.error(error.message || '审核失败');
  }
};

// 修改终结审核处理方法
const handleCompleteAudit = async (row, isApproved) => {
  try {
    const res = await fetch('/express/template/complete-audit', {  // 使用与其他请求一致的路径格式
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ID: row.ID,
        userId: userStore.userInfo.ID,
        userName: userStore.userInfo.nickName,
        content: {
          result: isApproved ? '通过' : '拒绝',
          comment: ''
        }
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    if (data.code === 0) {
      ElMessage.success(isApproved ? '已同意终��' : '已拒绝终结');
      getTableData();
    } else {
      throw new Error(data.message || '审核失败');
    }
  } catch (error) {
    console.error('审核失败:', error);
    ElMessage.error(error.message || '审核失败');
  }
};

// 签名相关状态
const signatureDialogVisible = ref(false)
const signatureLoading = ref(false)
const currentSignatureField = ref(null)
const signatureCanvas = ref(null)
const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)

// 修改初始化画布函数
const initCanvas = () => {
  const canvas = signatureCanvas.value
  if (!canvas) return

  // 获取设备像素比
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()

  // 设置画布的实际大小
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr

  const ctx = canvas.getContext('2d')

  // 缩放绘图上下文以匹配设备像素比
  ctx.scale(dpr, dpr)

  // 设置画布样式
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

// 修改开始绘制函数
const startDrawing = (event) => {
  isDrawing.value = true
  const canvas = signatureCanvas.value
  const rect = canvas.getBoundingClientRect()

  // 计算相对于画布的准确位置
  if (event.touches) {
    lastX.value = (event.touches[0].clientX - rect.left)
    lastY.value = (event.touches[0].clientY - rect.top)
  } else {
    lastX.value = (event.clientX - rect.left)
    lastY.value = (event.clientY - rect.top)
  }
}

// 修改绘制过程函数
const draw = (event) => {
  if (!isDrawing.value) return  // 如果没有按下鼠标，不进行绘制

  const canvas = signatureCanvas.value
  const ctx = canvas.getContext('2d')
  const rect = canvas.getBoundingClientRect()

  let currentX, currentY

  if (event.touches) {
    currentX = event.touches[0].clientX - rect.left
    currentY = event.touches[0].clientY - rect.top
  } else {
    currentX = event.clientX - rect.left
    currentY = event.clientY - rect.top
  }

  ctx.beginPath()
  ctx.moveTo(lastX.value, lastY.value)
  ctx.lineTo(currentX, currentY)
  ctx.stroke()

  lastX.value = currentX
  lastY.value = currentY
}

// 修改停止绘制函数
const stopDrawing = () => {
  isDrawing.value = false
}

// 修改触摸事件处理函数
const handleTouchStart = (event) => {
  event.preventDefault()
  const touch = event.touches[0]
  const rect = event.target.getBoundingClientRect()
  lastX.value = touch.clientX - rect.left
  lastY.value = touch.clientY - rect.top
  isDrawing.value = true
}

const handleTouchMove = (event) => {
  event.preventDefault()
  if (!isDrawing.value) return

  const touch = event.touches[0]
  const rect = event.target.getBoundingClientRect()
  const currentX = touch.clientX - rect.left
  const currentY = touch.clientY - rect.top

  const ctx = signatureCanvas.value.getContext('2d')
  ctx.beginPath()
  ctx.moveTo(lastX.value, lastY.value)
  ctx.lineTo(currentX, currentY)
  ctx.stroke()

  lastX.value = currentX
  lastY.value = currentY
}

// 修改清除签名函数
const clearSignature = () => {
  const canvas = signatureCanvas.value
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
}

const SignaturePathGol = ref(null)
// 修改确认签名函数
const confirmSignature = async () => {
  const canvas = signatureCanvas.value;
  // 检查是否有签名
  const ctx = canvas.getContext('2d');
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const hasSignature = pixels.some(pixel => pixel !== 0);

  if (!hasSignature) {
    ElMessage.warning('请先签名');
    return;
  }

  signatureLoading.value = true;
  try {
    // 创建临时画布进行缩放
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // 设置临时画布大小为实际显示大小
    tempCanvas.width = canvas.width / dpr;
    tempCanvas.height = canvas.height / dpr;

    // 将原画布内容绘制到临时画布
    tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height,
      0, 0, tempCanvas.width, tempCanvas.height);

    // 将临时画布转换为base64图片
    const signatureImage = tempCanvas.toDataURL('image/png');

    // 先上传签名图片
    const signaturePath = await uploadSignature(signatureImage);
    SignaturePathGol.value = signaturePath
    // 更新表单字段
    if (currentSignatureField.value) {
      if (typeof currentSignatureField.value.setValue === 'function') {
        currentSignatureField.value.setValue(signaturePath);
        // 触发表单验证更新
        currentSignatureField.value.$emit && currentSignatureField.value.$emit('change', signaturePath);
      } else {
        currentSignatureField.value.value = signaturePath;
        // 如果是响应式对象，确保触发更新
        if (currentSignatureField.value.value && typeof currentSignatureField.value.value === 'object') {
          currentSignatureField.value.value = { ...currentSignatureField.value.value };
        }
      }
    }

    // 强制更新表单验证
    nextTick(() => {
      const form = document.querySelector('form');
      form && form.dispatchEvent(new Event('change'));
    });

    signatureDialogVisible.value = false;
    ElMessage.success('签名成功');
  } catch (error) {
    console.error('签名失败:', error);
    ElMessage.error(error.message || '签名失败');
  } finally {
    signatureLoading.value = false;
  }
};


// 确保这些函数被定义在 setup 作用域内
const openSignatureDialog = (field) => {
  currentSignatureField.value = field
  signatureDialogVisible.value = true
  nextTick(() => {
    initCanvas()
  })
}

// 处理表格中的签名
const handleTableSignature = (row, key) => {
  currentSignatureField.value = {
    value: row[key],
    setValue: (value) => {
      row[key] = value
    }
  }
  signatureDialogVisible.value = true
  nextTick(() => {
    initCanvas()
  })
}

// 确保导出这些方法
defineExpose({
  openSignatureDialog,
  handleTableSignature
})


// 修改工作完成表单
const completeForm = ref({
  comment: '',
  signature: '' // 添加签名字段
})

const submitComplete = async () => {
  if (!completeForm.value.comment) {
    ElMessage.warning('请填写完成说明');
    return;
  }
  if (!completeForm.value.signature) {
    ElMessage.warning('请完成签名');
    return;
  }

  try {
    // 先上传签名图片
    const signaturePath = await uploadSignature(completeForm.value.signature);

    const res = await fetch('/express/template/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ID: currentRow.value.ID,
        userId: userStore.userInfo.ID,
        userName: userStore.userInfo.nickName,
        content: {
          comment: completeForm.value.comment,
          signature: signaturePath // 使用上传后的图片路径
        }
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    if (data.code === 0) {
      ElMessage.success('工作已完成');
      workExecutionStatus.value.isCompleting = false;
      getTableData();
    } else {
      throw new Error(data.message || '提交失败');
    }
  } catch (error) {
    console.error('提交失败:', error);
    ElMessage.error(error.message || '提交失败');
  }
};

// 重置工作完成表单
const resetCompleteForm = () => {
  completeForm.value = {
    comment: '',
    signature: ''
  }
}

// 添加终结确认弹窗的状态
const completeConfirmDialogVisible = ref(false)
const completeConfirmForm = ref({
  signature: '',
  currentRow: null,
  isApproved: false
})

// 添加打开终结确认弹窗的方法
const openCompleteConfirmDialog = (row, isApproved) => {
  completeConfirmForm.value = {
    signature: '',
    currentRow: row,
    isApproved
  }
  completeConfirmDialogVisible.value = true
}

// 添加提交终结确认的方法
const submitCompleteConfirm = async () => {
  if (!completeConfirmForm.value.signature) {
    ElMessage.warning('请完成签名');
    return;
  }

  try {
    // 先上传签名图片
    const signaturePath = await uploadSignature(completeConfirmForm.value.signature);

    const res = await fetch('/express/template/complete-audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ID: completeConfirmForm.value.currentRow.ID,
        userId: userStore.userInfo.ID,
        userName: userStore.userInfo.nickName,
        content: {
          result: completeConfirmForm.value.isApproved ? '通过' : '拒绝',
          comment: '',
          signature: signaturePath // 使用上传后的图片路径
        }
      })
    }).then(res => res.json());

    if (res.code === 0) {
      ElMessage.success('已同意终结');
      completeConfirmDialogVisible.value = false;
      getTableData();
    } else {
      throw new Error(res.message || '操作失败');
    }
  } catch (error) {
    console.error('终结确认失败:', error);
    ElMessage.error(error.message || '终结确认失败');
  }
};

// 添加上传签名图片的方法
const uploadSignature = async (base64Image) => {
  try {
    const res = await fetch('/express/template/upload-signature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        signature: base64Image
      })
    }).then(res => res.json());

    if (res.code === 0) {
      const path = res.data.path;
      return path; // 返回保存的图片路径
    } else {
      throw new Error(res.message || '上传签名失败');
    }
  } catch (error) {
    console.error('上传签名失败:', error);
    ElMessage.error(error.message || '上传签名失败');
    throw error;
  }
};

// 修改日志显示相关的渲染逻辑


const renderLogContent = (content) => {
  if (!content) return '';

  const result = [];


 
  const processValue = (key, value) => {
    // 处理签名字段
    if (typeof value === 'string' &&
      (key.toLowerCase().includes('签名') || key === 'signature')) {
      const imgSrc = value.startsWith('data:image') ? 
        value : 
        `${import.meta.env.VITE_API_BASE_URL}${value}`;
      return h('div', { class: 'log-field' }, [
        h('span', { class: 'field-name' }, `${key}:`),
        h('img', {
          src: imgSrc,
          class: 'signature-image-small',
          alt: '签名图片',
          style: {
            maxWidth: '100px',
            maxHeight: '50px',
            border: '1px solid #dcdfe6',
            borderRadius: '2px',
            padding: '2px',
            backgroundColor: '#fff'
          }
        })
      ]);
    }

    // 处理对象类型
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        value = value.map(item => {
          if (typeof item === 'object') {
            // 检查对象中是否包含签名字段
            for (const [k, v] of Object.entries(item)) {
              if ((k.toLowerCase().includes('签名') || k === 'signature') &&
                typeof v === 'string' &&
                v.startsWith('data:image')) {
                return h('div', { class: 'signature-field' }, [
                  h('img', {
                    src: v,
                    class: 'signature-image-small',
                    alt: '签名图片'
                  })
                ]);
              }
            }
            return Object.values(item).filter(v => v).join(', ');
          }
          return item;
        }).join(', ');
      } else {
        try {
          const parsed = typeof value === 'string' ? JSON.parse(value) : value;
          // 检查解析后的对象是否包含签名
          if (parsed.signature && parsed.signature.startsWith('data:image')) {
            return h('div', { class: 'signature-field' }, [
              h('img', {
                src: parsed.signature,
                class: 'signature-image-small',
                alt: '签名图片'
              })
            ]);
          }
          value = parsed.name || JSON.stringify(parsed);
        } catch {
          value = JSON.stringify(value);
        }
      }
    }

    return h('div', { class: 'log-field' }, [
      h('span', { class: 'field-name' }, `${key}:`),
      h('span', { class: 'field-value' }, value)
    ]);
  };

  // 遍历内容
  for (const [key, value] of Object.entries(content)) {
    if (!value) continue;
    result.push(processValue(key, value));
  }

  return h('div', { class: 'log-content' }, result);
};
const renderLogHistory = (log) => {
  if (!log || !log.history) return null;

  return h('div', { class: 'log-history' },
    log.history.map(entry => h('div', { class: 'log-entry' }, [
      // 日志头部信息
      h('div', { class: 'log-header' }, [
        h('span', { class: 'user-name' }, entry.userName),
        h('span', { class: 'action-name' }, entry.action),
        h('span', { class: 'timestamp' }, new Date(entry.timestamp).toLocaleString())
      ]),
      // 使用renderLogContent渲染日志内容
      renderLogContent(entry.content)
    ]))
  );
};

// 添加验证签名的方法
const validateSignature = (content) => {
  if (!content?.signature) {
    ElMessage.error('请先完成签名后再提交');
    return false;
  }
  return true;
};

// 修改提交终结审核的方法
const handleSubmitAudit = async () => {
  // 验证是否已签名
  if (!validateSignature(auditContent.value)) {
    return;
  }

  try {
    // 其他提交逻辑...
  } catch (error) {
    console.error('提交审核失败:', error);
    ElMessage.error('提交审核失败');
  }
};

// 判断是否可以作废工单
const canVoid = (row) => {
  try {
    // 只有创建人可以作废
    if (String(row.applicantId) !== String(userStore.userInfo.ID)) {
      return false;
    }

    const log = typeof row.log === 'string' ? JSON.parse(row.log) : row.log;
    if (!log) return false;

    // 只有在未完成状态下可以作废
    return log.currentStepType !== 'success' && log.currentStepType !== 'void' && log.currentStepType !== 'reject';
  } catch (e) {
    console.error('检查作废权限失败:', e);
    return false;
  }
};

// 确认作废操作
const confirmVoid = (row) => {
  ElMessageBox.confirm(
    '确定要作废此工作票吗？作废后不可恢复。',
    '作废确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    voidTicket(row);
  }).catch(() => {
    // 用户取消操作
  });
};

// 执行作废操作
const voidTicket = async (row) => {
  try {
    const res = await fetch('/express/template/void', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ID: row.ID,
        userId: userStore.userInfo.ID,
        userName: userStore.userInfo.nickName,
        content: {
          reason: '申�����人主动作废'
        }
      })
    }).then(res => res.json());

    if (res.code === 0) {
      ElMessage.success('工作票已作废');
      getTableData();
    } else {
      throw new Error(res.message || '作废失败');
    }
  } catch (error) {
    console.error('作废失败:', error);
    ElMessage.error(error.message || '作废失败');
  }
};

// 当前活动步骤
const currentStepIndex = ref(0);


// 处理流程图节点点击事件
const flowNodeClick = (node, index) => {
  console.log('点击了流程节点:', node, '索引:', index);
  
  // 获取当前状态类型
  const currentStatusType = localStorage.getItem('current_status_type');
  
  // 检查是否为作废状态
  if (currentStatusType === 'void') {
    ElMessage({
      message: '此工单已作废，无法进行操作',
      type: 'warning',
      duration: 3000
    });
    return;
  }
  
  // 检查节点是否被禁用
  if (node.isDisabled) {
    ElMessage({
      message: '此节点已被禁用，无法进行操作',
      type: 'warning'
    });
    return; // 如果节点被禁用，不执行任何操作
  }
  
  // 设置当前选中的步骤信息
  selectedStepInfo.value = {
    label: node.name,
    isActive: node.isActive,
    status: node.status,
    stepTypeLabel: getStepTypeLabel(index)
  };
}

// 获取步骤类型标签
const getStepTypeLabel = (index) => {
  switch(index) {
    case 0: return '创建阶段';
    case 1: return '审核阶段';
    case 2: return '执行阶段';
    case 3: return '终结阶段';
    default: return '';
  }
}

onMounted(() => {
  getTableData()
  // 初始化流程图数据，使用默认数据确保流程图能显示
  //  initDefaultFlowData()

})

// 初始化流程图数据
const initDefaultFlowData = () => {
  try {
    // 创建流程图数据
    const FlowDataVla = JSON.parse(localStorage.getItem('detailFrom_Val_z'))
    const StatusType = FlowDataVla.log.currentStepType
    const historyData = FlowDataVla.log.history || []
    
    // 存储当前状态类型，用于全局判断
    localStorage.setItem('current_status_type', StatusType);
    
    // 固定的四个流程步骤
    const fixedSteps = [
      { name: '创建', id: 'step-1', action: '创建' },
      { name: '审核通过', id: 'step-2', action: '审核通过' },
      { name: '提交终结审核', id: 'step-3', action: '工作完成' },
      { name: '终结审核通过', id: 'step-4', action: '终结审核通过' }
    ];
    
    // 检查历史记录中是否包含特定的action
    const hasAction = (actionName) => {
      return historyData.some(item => item.action === actionName || item.action.includes(actionName));
    };
    
    // 根据历史记录确定当前步骤位置
    let currentStep = 0;
    
    // 检查创建步骤
    if (hasAction('创建')) {
      currentStep = 1;
    }
    
    // 检查审核通过步骤
    if (hasAction('审核通过')) {
      currentStep = 2;
    }
    
    // 检查提交终结审核步骤
    if (hasAction('工作完成')) {
      currentStep = 3;
    }
    
    // 检查终结审核通过步骤
    if (hasAction('终结审核通过')) {
      currentStep = 4;
    }
    
    // 处理特殊状态
    if (StatusType === "void") {
      // 已作废状态
      currentStep = 0;
    }
    
    console.log('根据历史记录判断的当前步骤:', currentStep);
    
    // 根据currentStep设置每个步骤的状态
    const flowNodes = fixedSteps.map((step, index) => {
      // 确定每个节点的状态
      let status;
      if (StatusType === "void") {
        status = "wait";
      } else if (index + 1 === currentStep) {
        status = "doing"; // 当前步骤
      } else if (index + 1 < currentStep) {
        status = "ready"; // 已完成步骤
      } else {
        status = "wait"; // 未开始步骤
      }
      
      return {
        name: step.name,
        status: status,
        id: step.id,
        isDisabled: StatusType === "void",
        isActive: index + 1 === currentStep
      };
    });
    
    // 更新当前步骤索引（从0开始计算）
    const activeStepIndex = Math.max(0, currentStep - 1);
    
    // 设置流程图效果
    flowDataSet.value = flowNodes;
    // 更新当前步骤索引
    currentStepIndex.value = activeStepIndex;
    
  } catch (error) {
    console.error('初始化流程图出错:', error);
    // 出错时设置默认流程
    flowDataSet.value = [
      { name: '创建', status: 'doing', id: 'step-1' },
      { name: '审核通过', status: 'wait', id: 'step-2' },
      { name: '提交终结审核', status: 'wait', id: 'step-3' },
      { name: '终结审核通过', status: 'wait', id: 'step-4' }
    ];
    currentStepIndex.value = 0;
  }
};


</script>

<style scoped>
/* 使用 Element Plus 的变量 */
:deep(.el-tag) {
  margin: 0 4px;
}

.value-preview {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
  font-size: 13px;
  line-height: 1.4;
}

.popover-content {
  max-height: 500px;
  overflow-y: auto;
}

.popover-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.popover-item:last-child {
  border-bottom: none;
}

.popover-label {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.popover-value {
  color: var(--el-text-color-regular);
  word-break: break-word;
}

:deep(.value-popover) {
  max-width: 500px;
  padding: 12px;
}

:deep(.value-popover .el-table) {
  margin: 8px 0;
}

:deep(.value-popover .el-table--small) {
  font-size: 12px;
}

:deep(.value-popover .el-tag) {
  margin: 2px;
}

.gva-btn-list {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.current-state {
  margin-bottom: 20px;
  padding: 12px;
  background-color: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-base);
}

.el-tag {
  text-align: center;
  min-width: 60px;
}

.status-column {
  text-align: center;
}

.log-entry {
  padding: 8px;
  background-color: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-base);
}

.log-action {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.user-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.log-content {
  padding-left: 12px;
  border-left: 2px solid var(--el-border-color-lighter);
}

.audit-result {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.audit-comment {
  font-style: italic;
}

.log-field {
  display: flex;
  margin-bottom: 4px;
  align-items: center;
}

.field-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-right: 8px;
  min-width: 120px;
}

.field-value {
  flex: 1;
}

.el-button+.el-button {
  margin-left: 8px;
  /* 按钮之间的间距 */
}

/* 警告类型按钮的样式 */
.el-button--warning {
  &.el-button--link {
    color: var(--el-color-warning);

    &:hover {
      color: var(--el-color-warning-light-3);
    }
  }
}

.input-list-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 32px;
  padding: 4px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

.input-list-tag {
  margin: 2px;
}

.input-new-tag {
  width: 100%;
  max-width: 300px;
}

.table-container {
  width: 100%;
  margin-bottom: 16px;
}

.custom-table {
  margin-bottom: 12px;
}

.table-checkbox {
  display: flex;
  justify-content: center;
}

.add-row-btn {
  margin-top: 12px;
}

.signature-field {
  width: 100%;
}

/* 表格内部元素的样式调整 */
:deep(.el-table) {
  --el-table-header-bg-color: var(--el-fill-color-light);
}

:deep(.el-table__header) {
  font-weight: bold;
}

:deep(.el-input.el-input--small) {
  width: 100%;
}

:deep(.el-table .cell) {
  padding: 8px;
}

:deep(.el-checkbox) {
  margin-right: 0;
}

.auditor-select {
  width: 100%;
  max-width: 300px;
}

/* 详情展示样式 */
.detail-content {
  padding: 16px;
}

.detail-item {
  margin-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 12px;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: bold;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.detail-value {
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.detail-tag {
  margin: 0 4px 4px 0;
}

.detail-table {
  margin-top: 8px;
  width: 100%;
}

.date-range {
  color: var(--el-text-color-secondary);
}

.log-container {
  margin: 16px 0;
}

.log-entry {
  padding: 12px;
  border-radius: var(--el-border-radius-base);
  background-color: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color-lighter);
  margin-bottom: 8px;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.user-name {
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.log-field {
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-label {
  color: var(--el-text-color-regular);
  font-weight: 500;
  min-width: 100px;
}

.field-value {
  color: var(--el-text-color-primary);
}

:deep(.el-table) {
  --el-table-border-color: var(--el-border-color-lighter);
  --el-table-header-bg-color: var(--el-fill-color-light);
  --el-table-row-hover-bg-color: var(--el-fill-color);
  
  .el-table__header th {
    background-color: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
  }
  
  .el-table__row {
    background-color: var(--el-bg-color);
  }
}

:deep(.el-tag) {
  &.el-tag--info {
    --el-tag-bg-color: var(--el-fill-color-light);
    --el-tag-border-color: var(--el-border-color);
    --el-tag-text-color: var(--el-text-color-regular);
  }
}

.signature-image-small {
  max-width: 100px;
  max-height: 60px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  padding: 4px;
  background-color: var(--el-bg-color);
}

.input-list-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px;
}

.input-list-tag {
  margin: 2px;
}

:deep(.el-descriptions__body) {
  background-color: transparent;
}

:deep(.el-descriptions__cell) {
  padding: 16px;
}

:deep(.el-table--small) {
  font-size: 13px;
}

:deep(.el-table) {
  margin: 8px 0;
  --el-table-border-color: var(--el-border-color-lighter);
  --el-table-header-bg-color: var(--el-fill-color-light);
}

:deep(.el-tag) {
  margin: 0 4px;
}

.text-content {
  padding: 8px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  min-height: 24px;
  line-height: 1.5;
  word-break: break-word;
}

.detail-field {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 4px;
  background-color: var(--el-fill-color-blank);
}

.field-header {
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.field-content {
  color: var(--el-text-color-regular);
}

.datetime-range {
  padding: 8px 12px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  color: var(--el-text-color-primary);
}

/* 添加签名相关样式 */
.signature-container {
  width: 100%;
}

.signature-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.signature-input {
  width: 100%;
  max-width: 300px;
}

.table-signature-field {
  width: 100%;
}

.signature-dialog-content {
  padding: 20px;
}

.signature-tip {
  margin-bottom: 20px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

:deep(.el-input-group__append) {
  padding: 0;
}

:deep(.el-input-group__append .el-button) {
  margin: 0;
  border: none;
  height: 100%;
  border-radius: 0;
}

/* 表格中签名按钮的样式 */
:deep(.el-table .signature-input) {
  .el-input-group__append {
    padding: 0;

    .el-button {
      margin: 0;
      border: none;
      height: 100%;
      border-radius: 0;
    }
  }
}

/* 详情展示中的签名样式 */
.signature-display {
  padding: 8px 12px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  display: inline-block;
  min-width: 120px;
  text-align: center;
}

/* 修改签名相关样式 */
.signature-dialog-content {
  padding: 20px;
}

.signature-tip {
  margin-bottom: 20px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.signature-canvas-container {
  border: 1px solid var(--el-border-color);
  margin-bottom: 16px;
  /* 添加固定尺寸 */
  width: 560px;
  height: 200px;
}

.flow-chart-container {
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
}

/* 高亮当前步骤 */
.highlight-step {
  animation: highlight-pulse 2s ease-in-out;
  border: 2px solid var(--el-color-primary, #409eff) !important;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.5) !important;
}

@keyframes highlight-pulse {
  0% { box-shadow: 0 0 0 rgba(64, 158, 255, 0.5); }
  50% { box-shadow: 0 0 15px rgba(64, 158, 255, 0.8); }
  100% { box-shadow: 0 0 0 rgba(64, 158, 255, 0.5); }
}

/* 调整流程图样式 */
.wizard-container {
  margin-bottom: 20px;
}

:deep(.wizard-node) {
  padding: 8px 16px !important;
  border-radius: 4px !important;
  background-color: #f5f7fa !important;
  color: #606266 !important;
  border: 1px solid #dcdfe6 !important;
  transition: all 0.3s ease !important;
  font-size: 14px !important;
  cursor: pointer !important;
}

:deep(.wizard-node:hover) {
  background-color: #ecf5ff !important;
  border-color: #409EFF !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1) !important;
}

:deep(.wizard-node.active) {
  background-color: #409EFF !important;
  color: white !important;
  border-color: #409EFF !important;
  font-weight: bold !important;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4) !important;
}

:deep(.wizard-node.start) {
  background-color: #67c23a !important;
  color: white !important;
  border-color: #67c23a !important;
}

:deep(.wizard-node.end) {
  background-color: #e6a23c !important;
  color: white !important;
  border-color: #e6a23c !important;
}

.signature-canvas {
  width: 100%;
  height: 100%;
  cursor: crosshair;
  background-color: #fff;
  touch-action: none;
  /* 禁用浏览器默认的触摸行为 */
}

.signature-actions {
  text-align: right;
  margin-bottom: 16px;
}

.signature-image {
  max-width: 200px;
  max-height: 100px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 4px;
  background-color: #fff;
}

.signature-image-small {
  max-width: 100px;
  max-height: 50px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 2px;
  padding: 2px;
  background-color: #fff;
}

.table-signature-field {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 表单中的签名字段样式 */
.signature-field {
  width: 100%;
  max-width: 300px;
  min-height: 80px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.signature-placeholder {
  color: var(--el-text-color-placeholder);
  text-align: center;
  width: 100%;
}
.flow-wizard {
  margin: 0 auto;
  display: flex;
  justify-content: center;
}

:deep(.flow-wizard .tiny-wizard-node) {
  min-width: 100px;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  cursor: pointer;
  display: block !important; /* 确保所有节点都显示 */
}

:deep(.flow-wizard .tiny-wizard-node.start),
:deep(.flow-wizard .tiny-wizard-node.end) {
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
}

:deep(.flow-wizard .tiny-wizard-line) {
  flex: 0 0 auto;
}

/* 当容器较窄时调整样式 */
@media (max-width: 600px) {
  :deep(.flow-wizard .tiny-wizard-node) {
    min-width: 80px;
    font-size: 12px;
  }

  :deep(.flow-wizard .tiny-wizard-line) {
    min-width: 40px;
  }
}

/* 步骤详情样式 */
.step-details-container {
  margin-top: 15px;
  border-top: 1px dashed var(--el-border-color);
  padding-top: 15px;
}

.step-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.step-details-title {
  font-weight: bold;
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.step-details-content {
  background-color: var(--el-bg-color-page);
  border-radius: var(--el-border-radius-base);
  padding: 12px;
}

.step-detail-item {
  display: flex;
  margin-bottom: 8px;
  line-height: 1.5;
}

.detail-label {
  font-weight: 500;
  color: var(--el-text-color-primary);
  min-width: 80px;
  margin-right: 10px;
}

.detail-value {
  color: var(--el-text-color-regular);
}

.step-content-preview {
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  padding: 10px;
}

.step-preview-label {
  font-weight: bold;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.step-preview-value {
  word-break: break-all;
  white-space: pre-wrap;
  color: var(--el-text-color-regular);
  font-family: var(--el-font-family-monospace);
  font-size: 13px;
  background-color: var(--el-fill-color-lighter);
  padding: 8px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.no-step-details {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
  color: var(--el-text-color-secondary);
}

/* 高亮效果 */
.highlight-step {
  animation: highlight-pulse 1.5s ease-in-out;
}

@keyframes highlight-pulse {
  0% { background-color: transparent; }
  30% { background-color: var(--el-color-primary-light-9); }
  100% { background-color: transparent; }
}

.flow-wizard {
  margin-bottom: 10px;
}
.flow-wizard {
  margin: 0 auto;
  display: flex;
  justify-content: center;
}

:deep(.flow-wizard .tiny-wizard-node) {
  min-width: 200px;
  text-align: center;
}

:deep(.flow-wizard .tiny-wizard-line) {
  flex: 0 0 auto;
}

.flow-wizard {
  width: 100%;
  padding: 10px 0;
  overflow-x: auto;
  overflow-y: visible;
  min-height: 80px;
}

:deep(.flow-wizard .tiny-wizard-node[data-node-type="start"]),
:deep(.flow-wizard .tiny-wizard-node[data-node-type="end"]) {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
}

/* 确保线条也显示 */
:deep(.flow-wizard .tiny-wizard-line) {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
}

/* 被禁用节点样式 */
:deep(.flow-wizard .tiny-wizard-node.isDisabled),
:deep(.flow-wizard .tiny-wizard-node[data-disabled="true"]) {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
  filter: grayscale(1) !important;
  pointer-events: auto !important; /* 允许点击事件以便我们可以显示提示 */
  background-color: #f0f0f0 !important;
  border-color: #dcdcdc !important;
  color: #999 !important;
  box-shadow: none !important;
  border-style: dashed !important;
}

/* 被禁用节点悬停效果 */
:deep(.flow-wizard .tiny-wizard-node.isDisabled:hover),
:deep(.flow-wizard .tiny-wizard-node[data-disabled="true"]:hover) {
  transform: none !important;
  box-shadow: none !important;
}

/* 添加流程已完成标记(小绿点) */
:deep(.flow-wizard .tiny-wizard-node[status="ready"]) {
  position: relative;
}

:deep(.flow-wizard .tiny-wizard-node[status="ready"])::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 10px;
  background-color: #67C23A;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
  z-index: 2;
}

/* 已完成节点样式 */
:deep(.flow-wizard .tiny-wizard-node[status="ready"]) {
  background-color: rgba(103, 194, 58, 0.1) !important;
  border-color: #67C23A !important;
  color: #2c9934 !important;
}

/* 当前节点样式 */
:deep(.flow-wizard .tiny-wizard-node[status="doing"]) {
  background-color: #409EFF !important;
  color: white !important;
  border-color: #409EFF !important;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
}

/* 流程图整体样式优化 */
.flow-wizard {
  margin: 0 auto;
  padding: 10px 0 20px;
  overflow-x: auto;
  overflow-y: visible;
  min-height: 80px;
}

:deep(.flow-wizard .tiny-wizard-node) {
  min-width: 120px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
}

/* 作废状态的流程节点样式 */
:deep(.flow-wizard .tiny-wizard-node[isDisabled="true"]) {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(0.8);
  border-style: dashed;
}
</style>