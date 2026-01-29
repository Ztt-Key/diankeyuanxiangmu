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

        <el-form-item label="模板名称" prop="name">
          <el-input v-model="searchInfo.name" placeholder="搜索条件" />
        </el-form-item>

        <template v-if="showAllQuery">
          <!-- 将需要控制显示状态的查询条件添加到此范围内 -->
        </template>

        <el-form-item>
          <el-button type="primary" icon="search" @click="onSubmit">查询</el-button>
          <el-button icon="refresh" @click="onReset">重置</el-button>
          <!-- <el-button link type="primary" icon="arrow-down" @click="showAllQuery=true" v-if="!showAllQuery">展开</el-button>
          <el-button link type="primary" icon="arrow-up" @click="showAllQuery=false" v-else>收起</el-button> -->
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <div class="gva-btn-list">
        <el-button type="primary" icon="plus" @click="openDialog()">新增</el-button>
        <el-button icon="delete" style="margin-left: 10px;" :disabled="!multipleSelection.length"
          @click="onDelete">删除</el-button>

      </div>
      <el-table ref="multipleTable" style="width: 100%" tooltip-effect="dark" :data="tableData" row-key="ID"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />

        <el-table-column align="left" label="日期" prop="createdAt" width="180">
          <template #default="scope">{{ formatDate(scope.row.CreatedAt) }}</template>
        </el-table-column>

        <el-table-column align="left" label="模板名称" prop="name" width="120" />
        <el-table-column label="模板内容" prop="value" width="200">
          <template #default="scope">
            {{ scope.row.value?.value?.length || 0 }} 个步骤
          </template>
        </el-table-column>
        <el-table-column align="left" label="操作" fixed="right" min-width="240">
          <template #default="scope">
            <el-button type="primary" link class="table-button" @click="getDetails(scope.row)"><el-icon
                style="margin-right: 5px">
                <InfoFilled />
              </el-icon>查看</el-button>
            <!-- <el-button  type="primary" link icon="edit" class="table-button" @click="updateThreeTucjetTemplateFunc(scope.row)">编辑</el-button> -->
            <el-button type="primary" link icon="delete" @click="deleteRow(scope.row)">删除</el-button>
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
        <el-form-item label="模板名称:" prop="name">
          <el-input v-model="formData.name" :clearable="true" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板内容:" prop="value">
          <!-- 添加可视化的结构化内容展示 -->
          <div class="template-content-display"
            style="margin-bottom: 20px; border: 1px solid #ebeef5; border-radius: 4px; padding: 15px;">
            <div v-if="formData.value && formData.value.value && formData.value.value.length > 0">
              <!-- 添加步骤按钮 -->
              <div class="action-bar" style="margin-bottom: 15px; text-align: right;">
                <el-button type="primary" size="small" icon="Plus" @click="addStepToFormData">添加步骤</el-button>
              </div>

              <div class="template-steps">
                <div v-for="(step, index) in formData.value.value" :key="index" class="template-step">
                  <div class="step-header">
                    <span class="step-number">步骤 {{ index + 1 }}</span>
                    <div class="step-title-container" style="flex: 1; display: flex; align-items: center;">
                      <el-input v-if="step.name !== undefined" v-model="step.name" size="small"
                        style="max-width: 200px; margin-right: 10px;" @input="updateFormDataJSON" placeholder="步骤名称" />
                      <el-input v-else-if="step.title !== undefined" v-model="step.title" size="small"
                        style="max-width: 200px; margin-right: 10px;" @input="updateFormDataJSON" placeholder="步骤标题" />
                    </div>
                    <!-- 步骤操作按钮 -->
                    <div class="step-actions" style="display: flex; gap: 8px;">
                      <el-button type="primary" size="small" @click="addPropertyToFormData(step)">添加属性</el-button>
                      <el-button type="danger" size="small" @click="removeStepFromFormData(index)">删除步骤</el-button>
                    </div>
                  </div>

                  <div class="step-body">
                    <!-- 对象类型处理 -->
                    <div v-if="typeof step === 'object' && step !== null">
                      <div v-for="(value, key) in step" :key="key" class="step-item" v-show="!isHiddenField(key)">
                        <!-- <select name="cars" id="cars">
                          <option value="audi">奥迪</option>
                          <option value="byd">比亚迪</option>
                          <option value="geely">吉利</option>
                          <option value="volvo">沃尔沃</option>
                        </select> -->
                        <span class="step-key">{{ keyToDisplay(key) }}:</span>
                        <div class="step-value">
                          <!-- 简单值处理 - 直接编辑 -->
                          <div v-if="!isComplexValue(value)">
                            <span v-if="typeof value === 'boolean'">
                              <el-switch v-model="step[key]" @change="updateFormDataJSON" />
                            </span>
                            <span v-else-if="typeof value === 'number'">
                              <el-input-number v-model="step[key]" :controls="false" size="small"
                                @change="updateFormDataJSON" />
                            </span>
                            <span v-else-if="typeof value === 'string' && key.toLowerCase() === 'type'">
                              <el-select v-model="step[key]" size="small" @change="updateFormDataJSON" placeholder="请选择类型">
  
                                <el-option label="创建" value="input"></el-option>
                                <el-option label="审核中" value="audit"></el-option>
                              </el-select>
                            </span>
                            <span v-else-if="typeof value === 'string'">
                              <el-input v-model="step[key]" size="small" @input="updateFormDataJSON" />
                            </span>
                            <span v-else-if="value === null || value === undefined">
                              <el-input v-model="step[key]" placeholder="空值" size="small" @input="updateFormDataJSON" />
                            </span>
                            <span v-else>{{ value }}</span>
                            <!-- 删除属性按钮 -->
                            <el-button type="danger" size="small" style="margin-left: 10px;"
                              @click="removePropertyFromFormData(step, key)">删除属性</el-button>
                          </div>

                          <!-- 复杂值处理 -->
                          <div v-else>
                            <div style="display: flex; align-items: center;">
                              <span v-if="value && value.name !== undefined">
                                名称: <el-input v-model="value.name" size="small"
                                  style="width: 120px; margin: 0 10px 0 5px;" @input="updateFormDataJSON" />
                              </span>
                              <span v-if="value && value.title !== undefined">
                                标题: <el-input v-model="value.title" size="small"
                                  style="width: 120px; margin: 0 10px 0 5px;" @input="updateFormDataJSON" />
                              </span>
                              <span class="complex-toggle" @click="toggleExpand(key)">查看详情 {{ expandedItems[key] ? '[-]'
                                :
                                '[+]' }}</span>
                              <!-- 删除属性按钮 -->
                              <el-button type="danger" size="small" style="margin-left: 10px;"
                                @click="removePropertyFromFormData(step, key)">删除属性</el-button>
                            </div>

                            <!-- 展开内容 -->
                            <div v-if="expandedItems[key]" class="complex-content">
                              <!-- 数组类型处理 -->
                              <div v-if="Array.isArray(value)">
                                <!-- 数组操作按钮 -->
                                <div style="margin-bottom: 10px;">
                                  <el-button type="primary" size="small"
                                    @click="addArrayItemToFormData(step, key)">添加项</el-button>
                                </div>

                                <div v-for="(item, idx) in value" :key="`${key}-${idx}`" class="array-item">
                                  <div class="array-index">{{ idx }}:</div>
                                  <div class="array-value">
                                    <!-- 数组中的复杂对象 -->
                                    <div v-if="isComplexValue(item)">
                                      <div style="display: flex; align-items: center;">
                                        <span v-if="item && item.name !== undefined">
                                          名称: <el-input v-model="item.name" size="small"
                                            style="width: 120px; margin: 0 10px 0 5px;" @input="updateFormDataJSON" />
                                        </span>
                                        <span v-if="item && item.title !== undefined">
                                          标题: <el-input v-model="item.title" size="small"
                                            style="width: 120px; margin: 0 10px 0 5px;" @input="updateFormDataJSON" />
                                        </span>
                                        <span class="complex-toggle" @click="toggleExpand(`${key}-${idx}`)">
                                          查看详情 {{ expandedItems[`${key}-${idx}`] ? '[-]' : '[+]' }}
                                        </span>
                                        <!-- 删除数组项按钮 -->
                                        <el-button type="danger" size="small" style="margin-left: 10px;"
                                          @click="removeArrayItemFromFormData(step, key, idx)">删除项</el-button>
                                      </div>

                                      <!-- 嵌套展开内容 -->
                                      <div v-if="expandedItems[`${key}-${idx}`]" class="complex-content nested-content">
                                        <div class="object-nested">
                                          <!-- 添加属性按钮 -->
                                          <div style="margin-bottom: 10px;">
                                            <el-button type="primary" size="small"
                                              @click="addNestedPropertyToFormData(item)">添加属性</el-button>
                                          </div>

                                          <div v-for="(nestedValue, nestedKey) in item"
                                            :key="`${key}-${idx}-${nestedKey}`" class="nested-property"
                                            v-show="!isHiddenField(nestedKey)">
                                            <div class="property-key">{{ keyToDisplay(nestedKey) }}:</div>
                                            <div class="property-value">
                                              <!-- 简单值编辑 -->
                                              <div v-if="!isComplexValue(nestedValue)">
                                                <span v-if="typeof nestedValue === 'boolean'">
                                                  <el-switch v-model="item[nestedKey]" @change="updateFormDataJSON" />
                                                </span>
                                                <span v-else-if="typeof nestedValue === 'number'">
                                                  <el-input-number v-model="item[nestedKey]" :controls="false"
                                                    size="small" @change="updateFormDataJSON" />
                                                </span>
                                                <span v-else-if="typeof nestedValue === 'string'">
                                                  <el-input v-model="item[nestedKey]" size="small"
                                                    @input="updateFormDataJSON" />
                                                </span>
                                                <span v-else-if="nestedValue === null || nestedValue === undefined">
                                                  <el-input v-model="item[nestedKey]" placeholder="空值" size="small"
                                                    @input="updateFormDataJSON" />
                                                </span>
                                                <span v-else>{{ nestedValue }}</span>
                                                <!-- 删除属性按钮 -->
                                                <el-button type="danger" size="small" style="margin-left: 10px;"
                                                  @click="removePropertyFromFormData(item, nestedKey)">删除属性</el-button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <!-- 数组中的简单值 - 直接编辑 -->
                                    <div v-else>
                                      <span v-if="typeof item === 'boolean'">
                                        <el-switch v-model="value[idx]" @change="updateFormDataJSON" />
                                      </span>
                                      <span v-else-if="typeof item === 'number'">
                                        <el-input-number v-model="value[idx]" :controls="false" size="small"
                                          @change="updateFormDataJSON" />
                                      </span>
                                      <span v-else-if="typeof item === 'string'">
                                        <el-input v-model="value[idx]" size="small" @input="updateFormDataJSON" />
                                      </span>
                                      <span v-else-if="item === null || item === undefined">
                                        <el-input v-model="value[idx]" placeholder="空值" size="small"
                                          @input="updateFormDataJSON" />
                                      </span>
                                      <span v-else>{{ item }}</span>

                                      <!-- 删除数组项按钮 -->
                                      <el-button type="danger" size="small" style="margin-left: 10px;"
                                        @click="removeArrayItemFromFormData(step, key, idx)">删除项</el-button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-template">
              <div style="text-align: center; width: 100%;">
                <el-empty description="暂无模板内容" />
                <el-button type="primary" @click="addStepToFormData">添加第一个步骤</el-button>
              </div>
            </div>
          </div>

          <!-- JSON编辑器标题 -->
          <!-- <div style="margin: 10px 0 5px 0; font-weight: bold; color: #606266;">JSON编辑区域：</div>
               -->
          <!-- 原有的JSON编辑功能 -->
          <!-- <el-input
                v-model="inputValue"
                type="textarea"
                :rows="15"
                style="height: 350px;"
              /> -->
        </el-form-item>
      </el-form>
    </el-drawer>

    <el-drawer destroy-on-close size="800" v-model="detailShow" :show-close="true" :before-close="closeDetailShow"
      :title="isEditingDetails ? '编辑' : '查看'">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg">{{ isEditingDetails ? '编辑' : '查看' }}</span>
          <div>
            <el-button v-if="!isEditingDetails" type="primary" @click="switchToEditMode">编辑</el-button>
            <el-button v-if="isEditingDetails" :loading="saveLoading" type="primary"
              @click="saveDetailsEdit">保存</el-button>
            <el-button v-if="isEditingDetails" @click="cancelDetailsEdit">取消</el-button>
          </div>
        </div>
      </template>

      <div v-if="!isEditingDetails">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="模板名称">
            {{ detailFrom.name }}
          </el-descriptions-item>
          <el-descriptions-item label="模板内容">
            <div class="template-content-display">
              <div v-if="detailFrom.value && detailFrom.value.value">
                <div class="template-steps">
                  <div
                    v-for="(step, index) in Array.isArray(detailFrom.value.value) ? detailFrom.value.value : [detailFrom.value.value]"
                    :key="index" class="template-step">
                    <div class="step-header">
                      <span class="step-number">步骤 {{ index + 1 }}</span>
                      <span v-if="step.name || step.title" class="step-title">{{ step.name || step.title }}</span>
                    </div>

                    <!-- 使用div代替template，并确保结构清晰 -->
                    <div class="step-body">
                      <!-- 对象类型处理 -->
                      <div v-if="typeof step === 'object' && step !== null">
                        <div v-for="(value, key) in step" :key="key" class="step-item" v-show="!isHiddenField(key)">
                          <span class="step-key">{{ keyToDisplay(key) }}:</span>
                          <div class="step-value">
                            <!-- 复杂值处理 -->
                            <div v-if="isComplexValue(value)">
                              <span v-if="value && value.name" class="object-name">"{{ value.name }}"</span>
                              <span v-if="value && value.title" class="object-title">"{{ value.title }}"</span>
                              <span class="complex-toggle" @click="toggleExpand(key)">查看详情 {{ expandedItems[key] ? '[-]'
                                :
                                '[+]' }}</span>

                              <!-- 展开内容 -->
                              <div v-if="expandedItems[key]" class="complex-content">
                                <!-- 数组类型处理 -->
                                <div v-if="Array.isArray(value)">
                                  <div v-for="(item, idx) in value" :key="`${key}-${idx}`" class="array-item">
                                    <div class="array-value">
                                      <!-- 数组中的复杂对象 -->
                                      <div v-if="isComplexValue(item)">
                                        <span v-if="item && item.name" class="object-name">"{{ item.name }}"</span>
                                        <span v-if="item && item.title" class="object-title">"{{ item.title }}"</span>
                                        <span class="complex-toggle" @click="toggleExpand(`${key}-${idx}`)">
                                          查看详情 {{ expandedItems[`${key}-${idx}`] ? '[-]' : '[+]' }}
                                        </span>

                                        <!-- 嵌套展开内容 -->
                                        <div v-if="expandedItems[`${key}-${idx}`]"
                                          class="complex-content nested-content">
                                          <div class="object-nested">
                                            <div v-for="(nestedValue, nestedKey) in item"
                                              :key="`${key}-${idx}-${nestedKey}`" class="nested-property"
                                              v-show="!isHiddenField(nestedKey)">
                                              <div class="property-key">{{ keyToDisplay(nestedKey) }}:</div>
                                              <div class="property-value">
                                                <!-- 递归处理更深层次的复杂对象 -->
                                                <div v-if="isComplexValue(nestedValue)">
                                                  <span v-if="nestedValue && nestedValue.name" class="object-name">"{{
                                                    nestedValue.name }}"</span>
                                                  <span v-if="nestedValue && nestedValue.title" class="object-title">"{{
                                                    nestedValue.title }}"</span>
                                                </div>
                                                <!-- 简单值显示 -->
                                                <div v-else>
                                                  <span class="value-content">
                                                    <span v-if="nestedValue === null || nestedValue === undefined"
                                                      class="null-value">空值</span>
                                                    <span v-else-if="typeof nestedValue === 'boolean'"
                                                      class="boolean-value">{{ nestedValue ? '是' : '否' }}</span>
                                                    <span v-else-if="typeof nestedValue === 'number'"
                                                      class="number-value">{{ nestedValue }}</span>
                                                    <span v-else-if="typeof nestedValue === 'string'"
                                                      class="string-value">{{ nestedValue }}</span>
                                                    <span v-else>{{ nestedValue }}</span>
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <!-- 数组中的简单值 -->
                                      <div v-else>
                                        <span class="value-content">
                                          <span v-if="item === null || item === undefined" class="null-value">空值</span>
                                          <span v-else-if="typeof item === 'boolean'" class="boolean-value">{{ item ?
                                            '是' :
                                            '否' }}</span>
                                          <span v-else-if="typeof item === 'number'" class="number-value">{{ item
                                            }}</span>
                                          <span v-else-if="typeof item === 'string'" class="string-value">{{ item
                                            }}</span>
                                          <span v-else>{{ item }}</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <!-- 对象类型处理 -->
                                <div v-else>
                                  <div class="object-nested">
                                    <div v-for="(nestedValue, nestedKey) in value" :key="`${key}-${nestedKey}`"
                                      class="nested-property" v-show="!isHiddenField(nestedKey)">
                                      <div class="property-key">{{ keyToDisplay(nestedKey) }}:</div>
                                      <div class="property-value">
                                        <!-- 嵌套对象处理 -->
                                        <div v-if="isComplexValue(nestedValue)">
                                          <span v-if="nestedValue && nestedValue.name" class="object-name">"{{
                                            nestedValue.name }}"</span>
                                          <span v-if="nestedValue && nestedValue.title" class="object-title">"{{
                                            nestedValue.title }}"</span>
                                        </div>
                                        <!-- 简单值显示 -->
                                        <div v-else>
                                          <span class="value-content">
                                            <span v-if="nestedValue === null || nestedValue === undefined"
                                              class="null-value">空值</span>
                                            <span v-else-if="typeof nestedValue === 'boolean'" class="boolean-value">{{
                                              nestedValue ? '是' : '否' }}</span>
                                            <span v-else-if="typeof nestedValue === 'number'" class="number-value">{{
                                              nestedValue }}</span>
                                            <span v-else-if="typeof nestedValue === 'string'" class="string-value">{{
                                              nestedValue }}</span>
                                            <span v-else>{{ nestedValue }}</span>
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <!-- 简单值处理 -->
                            <div v-else>
                              <span class="value-content">
                                <span v-if="value === null || value === undefined" class="null-value">空值</span>
                                <span v-else-if="typeof value === 'boolean'" class="boolean-value">{{ value ? '是' : '否'
                                  }}</span>
                                <span v-else-if="typeof value === 'number'" class="number-value">{{ value }}</span>
                                <span v-else-if="typeof value === 'string'" class="string-value">{{ value }}</span>
                                <span v-else>{{ value }}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <!-- 非对象类型处理 -->
                      <div v-else class="step-item">
                        <span class="step-value">
                          <span class="value-content">
                            <span v-if="step === null || step === undefined" class="null-value">空值</span>
                            <span v-else-if="typeof step === 'boolean'" class="boolean-value">{{ step ? '是' : '否'
                              }}</span>
                            <span v-else-if="typeof step === 'number'" class="number-value">{{ step }}</span>
                            <span v-else class="string-value">{{ step }}</span>
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div v-else>
        <el-form :model="detailFromEdit" label-position="top" ref="detailFormRef" label-width="80px">
          <el-form-item label="模板名称:">
            <el-input v-model="detailFromEdit.name" :clearable="true" placeholder="请输入模板名称" />
          </el-form-item>
          <el-form-item label="模板内容:">
            <!-- 添加可视化的结构化内容展示 -->
            <div class="template-content-display"
              style="margin-bottom: 20px; border: 1px solid #ebeef5; border-radius: 4px; padding: 15px;">
              <div v-if="detailFromEdit.value && detailFromEdit.value.value">
                <!-- 添加步骤按钮 -->
                <div class="action-bar" style="margin-bottom: 15px; text-align: right;">
                  <el-button type="primary" size="small" icon="Plus" @click="addStep">添加步骤</el-button>
                </div>

                <div class="template-steps">
                  <div
                    v-for="(step, index) in Array.isArray(detailFromEdit.value.value) ? detailFromEdit.value.value : [detailFromEdit.value.value]"
                    :key="index" class="template-step">
                    <div class="step-header">
                      <span class="step-number">步骤 {{ index + 1 }}</span>
                      <div class="step-title-container" style="flex: 1; display: flex; align-items: center;">
                        <el-input v-if="step.name !== undefined" v-model="step.name" size="small"
                          style="max-width: 200px; margin-right: 10px;" @input="updateJSON" placeholder="步骤名称" />
                        <el-input v-else-if="step.title !== undefined" v-model="step.title" size="small"
                          style="max-width: 200px; margin-right: 10px;" @input="updateJSON" placeholder="步骤标题" />
                      </div>
                      <!-- 步骤操作按钮 -->
                      <div class="step-actions" style="display: flex; gap: 8px;">
                        <el-button type="primary" size="small" @click="addProperty(step)">添加属性</el-button>
                        <el-button type="danger" size="small" @click="removeStep(index)">删除步骤</el-button>
                      </div>
                    </div>

                    <div class="step-body">
                      <!-- 对象类型处理 -->
                      <div v-if="typeof step === 'object' && step !== null">
                        <div v-for="(value, key) in step" :key="key" class="step-item" v-show="!isHiddenField(key)">
                          <span class="step-key">{{ keyToDisplay(key) }}:</span>
                          <div class="step-value">
                            <!-- 简单值处理 - 直接编辑 -->
                            <div v-if="!isComplexValue(value)">
                              <span v-if="typeof value === 'boolean'">
                                <el-switch v-model="step[key]" @change="updateJSON" />
                              </span>
                              <span v-else-if="typeof value === 'number'">
                                <el-input-number v-model="step[key]" :controls="false" size="small"
                                  @change="updateJSON" />
                              </span>
                              <span v-else-if="typeof value === 'string' && key.toLowerCase() === 'type'">
                              <el-select v-model="step[key]" size="small" @change="updateFormDataJSON" placeholder="请选择类型">
  
                                <el-option label="创建" value="input"></el-option>
                                <el-option label="审核中" value="audit"></el-option>
                              </el-select>
                            </span>
                              <span v-else-if="value === null || value === undefined">
                                <el-input v-model="step[key]" placeholder="空值" size="small" @input="updateJSON" />
                              </span>
                              <span v-else>{{ value }}</span>
                              <!-- 删除属性按钮 -->
                              <el-button type="danger" size="small" style="margin-left: 10px;"
                                @click="removeProperty(step, key)">删除属性</el-button>
                            </div>

                            <!-- 复杂值处理 -->
                            <div v-else>
                              <div style="display: flex; align-items: center;">
                                <span v-if="value && value.name !== undefined">
                                  名称: <el-input v-model="value.name" size="small"
                                    style="width: 120px; margin: 0 10px 0 5px;" @input="updateJSON" />
                                </span>
                                <span v-if="value && value.title !== undefined">
                                  标题: <el-input v-model="value.title" size="small"
                                    style="width: 120px; margin: 0 10px 0 5px;" @input="updateJSON" />
                                </span>
                                <span class="complex-toggle" @click="toggleExpand(key)">查看详情 {{ expandedItems[key] ?
                                  '[-]' :
                                  '[+]' }}</span>
                                <!-- 删除属性按钮 -->
                                <el-button type="danger" size="small" style="margin-left: 10px;"
                                  @click="removeProperty(step, key)">删除属性</el-button>
                              </div>

                              <!-- 展开内容 -->
                              <div v-if="expandedItems[key]" class="complex-content">
                                <!-- 数组类型处理 -->
                                <div v-if="Array.isArray(value)">
                                  <!-- 数组操作按钮 -->
                                  <div style="margin-bottom: 10px;">
                                    <el-button type="primary" size="small"
                                      @click="addArrayItem(step, key)">添加项</el-button>
                                  </div>

                                  <div v-for="(item, idx) in value" :key="`${key}-${idx}`" class="array-item">
                                    <div class="array-index">{{ idx }}:</div>
                                    <div class="array-value">
                                      <!-- 数组中的复杂对象 -->
                                      <div v-if="isComplexValue(item)">
                                        <div style="display: flex; align-items: center;">
                                          <span v-if="item && item.name !== undefined">
                                            名称: <el-input v-model="item.name" size="small"
                                              style="width: 120px; margin: 0 10px 0 5px;" @input="updateJSON" />
                                          </span>
                                          <span v-if="item && item.title !== undefined">
                                            标题: <el-input v-model="item.title" size="small"
                                              style="width: 120px; margin: 0 10px 0 5px;" @input="updateJSON" />
                                          </span>
                                          <span class="complex-toggle" @click="toggleExpand(`${key}-${idx}`)">
                                            查看详情 {{ expandedItems[`${key}-${idx}`] ? '[-]' : '[+]' }}
                                          </span>
                                          <!-- 删除数组项按钮 -->
                                          <el-button type="danger" size="small" style="margin-left: 10px;"
                                            @click="removeArrayItem(step, key, idx)">删除项</el-button>
                                        </div>

                                        <!-- 嵌套展开内容 -->
                                        <div v-if="expandedItems[`${key}-${idx}`]"
                                          class="complex-content nested-content">
                                          <div class="object-nested">
                                            <!-- 添加属性按钮 -->
                                            <div style="margin-bottom: 10px;">
                                              <el-button type="primary" size="small"
                                                @click="addNestedProperty(item)">添加属性</el-button>
                                            </div>

                                            <div v-for="(nestedValue, nestedKey) in item"
                                              :key="`${key}-${idx}-${nestedKey}`" class="nested-property"
                                              v-show="!isHiddenField(nestedKey)">
                                              <div class="property-key">{{ keyToDisplay(nestedKey) }}:</div>
                                              <div class="property-value">
                                                <!-- 简单值编辑 -->
                                                <div v-if="!isComplexValue(nestedValue)">
                                                  <span v-if="typeof nestedValue === 'boolean'">
                                                    <el-switch v-model="item[nestedKey]" @change="updateJSON" />
                                                  </span>
                                                  <span v-else-if="typeof nestedValue === 'number'">
                                                    <el-input-number v-model="item[nestedKey]" :controls="false"
                                                      size="small" @change="updateJSON" />
                                                  </span>
                                                  <span v-else-if="typeof nestedValue === 'string'">
                                                    <el-input v-model="item[nestedKey]" size="small"
                                                      @input="updateJSON" />
                                                  </span>
                                                  <span v-else-if="nestedValue === null || nestedValue === undefined">
                                                    <el-input v-model="item[nestedKey]" placeholder="空值" size="small"
                                                      @input="updateJSON" />
                                                  </span>
                                                  <span v-else>{{ nestedValue }}</span>
                                                  <!-- 删除属性按钮 -->
                                                  <el-button type="danger" size="small" style="margin-left: 10px;"
                                                    @click="removeProperty(item, nestedKey)">删除属性</el-button>
                                                </div>

                                                <!-- 复杂值处理 -->
                                                <div v-else>
                                                  <span v-if="nestedValue && nestedValue.name" class="object-name">"{{
                                                    nestedValue.name }}"</span>
                                                  <span v-if="nestedValue && nestedValue.title" class="object-title">"{{
                                                    nestedValue.title }}"</span>
                                                  <span class="complex-toggle"
                                                    @click="toggleExpand(`${key}-${idx}-${nestedKey}`)">
                                                    查看详情 {{ expandedItems[`${key}-${idx}-${nestedKey}`] ? '[-]' : '[+]'
                                                    }}
                                                  </span>
                                                  <!-- 删除属性按钮 -->
                                                  <el-button type="danger" size="small" style="margin-left: 10px;"
                                                    @click="removeProperty(item, nestedKey)">删除属性</el-button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <!-- 数组中的简单值 - 直接编辑 -->
                                      <div v-else>
                                        <span v-if="typeof item === 'boolean'">
                                          <el-switch v-model="value[idx]" @change="updateJSON" />
                                        </span>
                                        <span v-else-if="typeof item === 'number'">
                                          <el-input-number v-model="value[idx]" :controls="false" size="small"
                                            @change="updateJSON" />
                                        </span>
                                        <span v-else-if="typeof item === 'string'">
                                          <el-input v-model="value[idx]" size="small" @input="updateJSON" />
                                        </span>
                                        <span v-else-if="item === null || item === undefined">
                                          <el-input v-model="value[idx]" placeholder="空值" size="small"
                                            @input="updateJSON" />
                                        </span>
                                        <span v-else>{{ item }}</span>

                                        <!-- 删除数组项按钮 -->
                                        <el-button type="danger" size="small" style="margin-left: 10px;"
                                          @click="removeArrayItem(step, key, idx)">删除项</el-button>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <!-- 对象类型处理 -->
                                <div v-else>
                                  <div class="object-nested">
                                    <!-- 添加属性按钮 -->
                                    <div style="margin-bottom: 10px;">
                                      <el-button type="primary" size="small"
                                        @click="addNestedProperty(value)">添加属性</el-button>
                                    </div>

                                    <div v-for="(nestedValue, nestedKey) in value" :key="`${key}-${nestedKey}`"
                                      class="nested-property" v-show="!isHiddenField(nestedKey)">
                                      <div class="property-key">{{ keyToDisplay(nestedKey) }}:</div>
                                      <div class="property-value">
                                        <!-- 简单值编辑 -->
                                        <div v-if="!isComplexValue(nestedValue)">
                                          <span v-if="typeof nestedValue === 'boolean'">
                                            <el-switch v-model="value[nestedKey]" @change="updateJSON" />
                                          </span>
                                          <span v-else-if="typeof nestedValue === 'number'">
                                            <el-input-number v-model="value[nestedKey]" :controls="false" size="small"
                                              @change="updateJSON" />
                                          </span>
                                          <span v-else-if="typeof nestedValue === 'string'">
                                            <el-input v-model="value[nestedKey]" size="small" @input="updateJSON" />
                                          </span>
                                          <span v-else-if="nestedValue === null || nestedValue === undefined">
                                            <el-input v-model="value[nestedKey]" placeholder="空值" size="small"
                                              @input="updateJSON" />
                                          </span>
                                          <span v-else>{{ nestedValue }}</span>
                                          <!-- 删除属性按钮 -->
                                          <el-button type="danger" size="small" style="margin-left: 10px;"
                                            @click="removeProperty(value, nestedKey)">删除属性</el-button>
                                        </div>

                                        <!-- 复杂值处理 -->
                                        <div v-else>
                                          <span v-if="nestedValue && nestedValue.name" class="object-name">"{{
                                            nestedValue.name }}"</span>
                                          <span v-if="nestedValue && nestedValue.title" class="object-title">"{{
                                            nestedValue.title }}"</span>
                                          <span class="complex-toggle" @click="toggleExpand(`${key}-${nestedKey}`)">
                                            查看详情 {{ expandedItems[`${key}-${nestedKey}`] ? '[-]' : '[+]' }}
                                          </span>
                                          <!-- 删除属性按钮 -->
                                          <el-button type="danger" size="small" style="margin-left: 10px;"
                                            @click="removeProperty(value, nestedKey)">删除属性</el-button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- 非对象类型处理 -->
                      <div v-else class="step-item">
                        <span class="step-value">
                          <span class="value-content">
                            <span v-if="step === null || step === undefined">
                              <el-input v-model="detailFromEdit.value.value[index]" placeholder="空值" size="small"
                                @input="updateJSON" />
                            </span>
                            <span v-else-if="typeof step === 'boolean'">
                              <el-switch v-model="detailFromEdit.value.value[index]" @change="updateJSON" />
                            </span>
                            <span v-else-if="typeof step === 'number'">
                              <el-input-number v-model="detailFromEdit.value.value[index]" :controls="false"
                                size="small" @change="updateJSON" />
                            </span>
                            <span v-else-if="typeof step === 'string'">
                              <el-input v-model="detailFromEdit.value.value[index]" size="small" @input="updateJSON" />
                            </span>
                            <span v-else>{{ step }}</span>
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-template">
                <el-empty description="暂无模板内容" />
              </div>
            </div>

            <!-- JSON编辑器标题 -->
            <!-- <div style="margin: 10px 0 5px 0; font-weight: bold; color: #606266;">JSON编辑区域：</div> -->

            <!-- JSON编辑功能 -->
            <!-- <el-input v-model="detailsInputValue" type="textarea" :rows="15" style="height: 350px;" /> -->
          </el-form-item>
        </el-form>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import data from '@/plugin/threeTicket/data.json'
// 定义子组件
const ObjectDisplay = defineComponent({
  name: 'ObjectDisplay',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  components: {
    ObjectDisplay: {
      name: 'ObjectDisplaySelf',
      props: ['data'],
      template: '<div>递归组件</div>'
    }
  },
  setup(props, { expose }) {
    const expandedItems = ref({});

    const toggleExpand = (key) => {
      expandedItems.value[key] = !expandedItems.value[key];
    };

    const isHiddenField = (key) => {
      const hiddenFields = [
        'index',
        'id',
        'noIndex',
        'allow_save',
        'allowSave',
        'next_step',
        'nextStep',
        'reject_step',
        'rejectStep',
        'allow',
        'reject',
        'next',
        'previous',
        'previousStep',
        'previous_step',
        'save'
      ];

      // 确保key是字符串类型
      if (key === null || key === undefined) {
        return false;
      }

      // 将非字符串类型的key转为字符串
      const keyStr = String(key);

      const keyLower = keyStr.toLowerCase();
      return hiddenFields.some(field =>
        keyLower === field.toLowerCase() ||
        keyLower === field.replace(/_/g, '').toLowerCase() ||
        keyLower === 'no_' + field.toLowerCase() ||
        keyLower === 'no' + field.replace(/_/g, '').toLowerCase().charAt(0).toUpperCase() + field.replace(/_/g, '').toLowerCase().slice(1)
      );
    };

    // 将英文键名替换为中文
    const keyToDisplay = (key) => {
      // 确保key是字符串类型
      if (key === null || key === undefined) {
        return '';
      }

      // 将非字符串类型的key转为字符串
      const keyStr = String(key);

      const translations = {
        name: '名称',
        title: '标题',
        description: '描述',
        content: '内容',
        type: '类型',
        status: '状态',
        priority: '优先级',
        duration: '持续时间',
        assignee: '负责人',
        reporter: '报告人',
        deadline: '截止日期',
        createdAt: '创建时间',
        updatedAt: '更新时间',
        tags: '标签',
        category: '分类',
        level: '级别',
        value: '值',
        id: '编号',
        startTime: '开始时间',
        endTime: '结束时间',
        progress: '进度',
        result: '结果',
        action: '操作',
        reason: '原因',
        solution: '解决方案',
        steps: '步骤',
        params: '参数',
        config: '配置',
        options: '选项',
        target: '目标',
        source: '来源',
        message: '消息',
        isRequired: '是否必须',
        isEnabled: '是否启用',
        isVisible: '是否可见',
        isActive: '是否激活'
      };

      return translations[keyStr] || keyStr.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase());
    };

    // 格式化简单值
    const formatSimpleValue = (value, key) => {
      if (value === null || value === undefined) {
        return '空值';
      } else if (typeof value === 'boolean') {
        return value ? '是' : '否';
      } else if (typeof value === 'string') {
        if (key === 'status') {
          const statusMap = {
            'pending': '待处理',
            'processing': '处理中',
            'completed': '已完成',
            'rejected': '已拒绝',
            'approved': '已批准'
          };
          return statusMap[value] || value;
        } else if (key === 'priority') {
          const priorityMap = {
            'high': '高',
            'medium': '中',
            'low': '低'
          };
          return priorityMap[value] || value;
        } else if (key === 'type') {
          const typeMap = {
            'task': '任务',
            'bug': '缺陷',
            'feature': '功能',
            'improvement': '改进'
          };
          return typeMap[value] || value;
        }

        // 对于长字符串，截取并添加省略号
        if (value.length > 100) {
          return value.substring(0, 100) + '...';
        }
        return value;
      } else if (typeof value === 'number') {
        return value.toString();
      } else {
        return String(value);
      }
    };

    // 获取值类型
    const getValueType = (value) => {
      if (value === null || value === undefined) {
        return '空值';
      } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
          return `数组[${value.length}项]`;
        } else if (value instanceof Date) {
          return '日期';
        } else {
          return `对象[${Object.keys(value).length}个属性]`;
        }
      } else if (typeof value === 'string') {
        return '文本';
      } else if (typeof value === 'number') {
        return '数字';
      } else if (typeof value === 'boolean') {
        return '布尔值';
      } else {
        return typeof value;
      }
    };

    // 判断是否为复杂值
    const isComplexValue = (value) => {
      return typeof value === 'object' && value !== null;
    };

    expose({
      isHiddenField,
      keyToDisplay,
      formatSimpleValue,
      getValueType,
      isComplexValue
    });

    return {
      expandedItems,
      toggleExpand,
      isHiddenField,
      keyToDisplay,
      formatSimpleValue,
      getValueType,
      isComplexValue
    };
  }
});

// 导出组件选项
export default {
  name: 'ThreeTucjetTemplate',
  components: {
    ObjectDisplay
  }
}
</script>

<script setup>
import {
  createThreeTucjetTemplate,
  deleteThreeTucjetTemplate,
  deleteThreeTucjetTemplateByIds,
  updateThreeTucjetTemplate,
  findThreeTucjetTemplate,
  getThreeTucjetTemplateList
} from '@/plugin/threeTicket/api/threeTucjetTemplate'

// 全量引入格式化工具 请按需保留
import { getDictFunc, formatDate, formatBoolean, filterDict, filterDataSource, returnArrImg, onDownloadFile } from '@/utils/format'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref, reactive, watch, onMounted, nextTick } from 'vue'

// 提交按钮loading
const btnLoading = ref(false);

// 表单引用
const elFormRef = ref(null)
const elSearchFormRef = ref(null)

// 控制更多查询条件显示/隐藏状态
const showAllQuery = ref(false);

// 详情显示控制
const detailShow = ref(false);
const detailFrom = ref({});

// 打开详情弹窗
const openDetailShow = () => {
  detailShow.value = true;
}

// 自动化生成的字典（可能为空）以及字段
const formData = ref({
  name: '',
  value: {

  }
});

// 验证规则
const rule = reactive({
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' }
  ],
  value: [
    {
      validator: (rule, value, callback) => {
        try {
          if (typeof value === 'string') {
            JSON.parse(value)
          }
          callback()
        } catch (error) {
          callback(new Error('请输入有效的JSON格式'))
        }
      },
      trigger: 'blur'
    }
  ]
})

// 中间变量用于存储输入框的值
const inputValue = ref(JSON.stringify(formData.value, null, 2))

// 初始化时将 formData.value 转换为字符串
inputValue.value = JSON.stringify(formData.value.value, null, 2)

// 监听inputValue的变化并更新formData.value
watch(inputValue, (newVal) => {
  try {
    const parsedValue = JSON.parse(newVal)
    if (!formData.value.value) {
      formData.value.value = { value: [] }
    }
    formData.value.value.value = parsedValue
  } catch (error) {
    console.error('JSON解析错误:', error)
  }
}, { deep: true })

// 展开/折叠控制
const expandedItems = ref({})

// 切换展开/折叠
const toggleExpand = (key) => {
  expandedItems.value[key] = !expandedItems.value[key]
}

// 判断是否隐藏字段
const isHiddenField = (key) => {
  const hiddenFields = [
    'index',
    'id',
    'noIndex',
    'allow_save',
    'allowSave',
    'next_step',
    'nextStep',
    'reject_step',
    'rejectStep',
    'allow',
    'reject',
    'next',
    'previous',
    'previousStep',
    'previous_step',
    'save'
  ];

  // 确保key是字符串类型
  if (key === null || key === undefined) {
    return false;
  }

  // 将非字符串类型的key转为字符串
  const keyStr = String(key);

  const keyLower = keyStr.toLowerCase();
  return hiddenFields.some(field =>
    keyLower === field.toLowerCase() ||
    keyLower === field.replace(/_/g, '').toLowerCase() ||
    keyLower === 'no_' + field.toLowerCase() ||
    keyLower === 'no' + field.replace(/_/g, '').toLowerCase().charAt(0).toUpperCase() + field.replace(/_/g, '').toLowerCase().slice(1)
  );
};

// 判断是否为复杂值
const isComplexValue = (value) => {
  return typeof value === 'object' && value !== null;
};

// 获取值类型
const getValueType = (value) => {
  if (value === null || value === undefined) {
    return '空值';
  } else if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `数组[${value.length}项]`;
    } else if (value instanceof Date) {
      return '日期';
    } else {
      return `对象[${Object.keys(value).length}个属性]`;
    }
  } else if (typeof value === 'string') {
    return '文本';
  } else if (typeof value === 'number') {
    return '数字';
  } else if (typeof value === 'boolean') {
    return '布尔值';
  } else {
    return typeof value;
  }
};

// 打开详情
const getDetails = async (row) => {
  // 打开弹窗
  const res = await findThreeTucjetTemplate({ ID: row.ID })
  if (res.code === 0) {
    detailFrom.value = res.data
    console.log('详情数据:', detailFrom.value)

    // 确保在显示模板内容时可以展开折叠
    expandedItems.value = {} // 重置展开状态
    openDetailShow()

    // 延迟执行，确保DOM已更新
    setTimeout(() => {
      // 自动展开各个步骤中的数组和对象
      if (detailFrom.value.value && detailFrom.value.value.value) {
        const templateData = Array.isArray(detailFrom.value.value.value) ?
          detailFrom.value.value.value :
          [detailFrom.value.value.value];

        templateData.forEach((step, stepIndex) => {
          if (typeof step === 'object' && step !== null) {
            // 展开每个步骤的所有一级属性
            Object.keys(step).forEach(key => {
              if (!isHiddenField(key)) {
                expandedItems.value[key] = true

                // 如果是数组类型，展开前3个数组项
                if (Array.isArray(step[key])) {
                  const itemsToExpand = Math.min(step[key].length, 3); // 最多展开3个
                  for (let i = 0; i < itemsToExpand; i++) {
                    expandedItems.value[`${key}-${i}`] = true;

                    // 如果数组项是对象，也展开其主要属性
                    if (typeof step[key][i] === 'object' && step[key][i] !== null) {
                      // 展开对象的前几个关键属性
                      let propertiesExpanded = 0;
                      Object.keys(step[key][i]).forEach(nestedKey => {
                        if (!isHiddenField(nestedKey) && propertiesExpanded < 5) { // 限制最多展开5个属性
                          expandedItems.value[`${key}-${i}-${nestedKey}`] = true;
                          propertiesExpanded++;
                        }
                      });

                      // 如果有name属性，总是展开它
                      if (step[key][i].name) {
                        expandedItems.value[`${key}-${i}-name`] = true;
                      }
                    }
                  }
                }
                // 如果是对象类型但不是数组，也展开它的第一层属性
                else if (typeof step[key] === 'object' && step[key] !== null) {
                  Object.keys(step[key]).forEach(nestedKey => {
                    if (!isHiddenField(nestedKey)) {
                      expandedItems.value[`${key}-${nestedKey}`] = true;
                    }
                  });
                }
              }
            });
          }
        });
      }
    }, 100);
  }
}

// 关闭详情弹窗
const closeDetailShow = () => {
  detailShow.value = false
  detailFrom.value = {}
}

// 确保模板变量在组件创建时就初始化
onMounted(() => {
  // 初始化expandedItems，确保在点击时能够正确展开
  expandedItems.value = {};

  // 初始化查询条件
  searchInfo.value = {};

  // 获取表格数据
  getTableData();

  console.log('组件已挂载，初始化完成');
});

// =========== 表格控制部分 ===========
const page = ref(1)
const total = ref(0)
const pageSize = ref(10)
const tableData = ref([])
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

// 查询
const getTableData = async () => {
  const table = await getThreeTucjetTemplateList({ page: page.value, pageSize: pageSize.value, ...searchInfo.value })
  if (table.code === 0) {
    tableData.value = table.data.list
    total.value = table.data.total
    page.value = table.data.page
    pageSize.value = table.data.pageSize
  }
}

getTableData()

// ============== 表格控制部分结束 ===============

// 获取需要的字典 可能为空 按需保留
const setOptions = async () => {
}

// 获取需要的字典 可能为空 按需保留
setOptions()


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
    deleteThreeTucjetTemplateFunc(row)
  })
}

// 多选删除
const onDelete = async () => {
  ElMessageBox.confirm('确定要删除吗?', '提示', {
    confirmButtonText: '确定',
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
    const res = await deleteThreeTucjetTemplateByIds({ IDs })
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
const updateThreeTucjetTemplateFunc = async (row) => {
  const res = await findThreeTucjetTemplate({ ID: row.ID })
  type.value = 'update'
  if (res.code === 0) {
    formData.value = res.data
    // 确保正确展示结构化数据
    if (res.data.value && res.data.value.value) {
      inputValue.value = JSON.stringify(res.data.value.value, null, 2)

      // 重置展开状态
      expandedItems.value = {}

      // 延迟一下，确保DOM更新后处理展开
      setTimeout(() => {
        // 自动展开部分主要属性
        if (res.data.value.value.length > 0) {
          res.data.value.value.forEach((step, index) => {
            if (typeof step === 'object' && step !== null) {
              // 自动展开name和title
              if (step.name) expandedItems.value['name'] = true
              if (step.title) expandedItems.value['title'] = true
            }
          })
        }
      }, 100)
    }
    dialogFormVisible.value = true
  }
}


// 删除行
const deleteThreeTucjetTemplateFunc = async (row) => {
  const res = await deleteThreeTucjetTemplate({ ID: row.ID })
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

// 打开弹窗
const openDialog = () => {
  type.value = 'create'
  // 设置默认模板结构，使用导入的数据
  formData.value = {
    name: '',
    value: {
      value: data
    }
  }
  inputValue.value = JSON.stringify(formData.value.value.value, null, 2)

  // 重置展开状态
  expandedItems.value = {}

  // 延迟一下，确保DOM更新后处理展开
  setTimeout(() => {
    // 自动展开部分主要属性
    if (formData.value.value.value.length > 0) {
      formData.value.value.value.forEach((step, index) => {
        if (typeof step === 'object' && step !== null) {
          // 自动展开name和title
          if (step.name) expandedItems.value['name'] = true
          if (step.title) expandedItems.value['title'] = true
        }
      })
    }
  }, 100)

  dialogFormVisible.value = true
}

// 关闭弹窗
const closeDialog = () => {
  dialogFormVisible.value = false
  formData.value = {
    name: '',
    value: {
      value: []
    }
  }
  inputValue.value = JSON.stringify(formData.value.value, null, 2)
}
// 弹窗确定
const enterDialog = async () => {
  btnLoading.value = true
  elFormRef.value?.validate(async (valid) => {
    if (!valid) return btnLoading.value = false

    try {
      // 解析输入的JSON并包装成正确的结构
      const parsedValue = JSON.parse(inputValue.value)
      formData.value.value = {
        value: parsedValue
      }
    } catch (error) {
      ElMessage({
        type: 'error',
        message: 'JSON格式错误，请检查输入'
      })
      btnLoading.value = false
      return
    }

    let res
    switch (type.value) {
      case 'create':
        res = await createThreeTucjetTemplate(formData.value)
        break
      case 'update':
        res = await updateThreeTucjetTemplate(formData.value)
        break
      default:
        res = await createThreeTucjetTemplate(formData.value)
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

// 将英文键名替换为中文
const keyToDisplay = (key) => {
  // 确保key是字符串类型
  if (key === null || key === undefined) {
    return '';
  }

  // 将非字符串类型的key转为字符串
  const keyStr = String(key);

  const translations = {
    name: '名称',
    title: '标题',
    description: '描述',
    content: '内容',
    type: '类型',
    status: '状态',
    priority: '优先级',
    duration: '持续时间',
    assignee: '负责人',
    reporter: '报告人',
    deadline: '截止日期',
    createdAt: '创建时间',
    updatedAt: '更新时间',
    tags: '标签',
    category: '分类',
    level: '级别',
    value: '值',
    id: '编号',
    startTime: '开始时间',
    endTime: '结束时间',
    progress: '进度',
    result: '结果',
    action: '操作',
    reason: '原因',
    solution: '解决方案',
    steps: '步骤',
    params: '参数',
    config: '配置',
    options: '选项',
    target: '目标',
    source: '来源',
    message: '消息',
    isRequired: '是否必须',
    isEnabled: '是否启用',
    isVisible: '是否可见',
    isActive: '是否激活'
  };

  return translations[keyStr] || keyStr.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase());
};

// 详情页编辑相关
const isEditingDetails = ref(false)
const saveLoading = ref(false)
const detailFromEdit = ref({})
const detailsInputValue = ref('')
const detailFormRef = ref(null)

// 切换到编辑模式
const switchToEditMode = () => {
  isEditingDetails.value = true
  detailFromEdit.value = JSON.parse(JSON.stringify(detailFrom.value))

  // 设置JSON编辑区域的初始值
  if (detailFromEdit.value.value && detailFromEdit.value.value.value) {
    detailsInputValue.value = JSON.stringify(detailFromEdit.value.value.value, null, 2)
  } else {
    detailsInputValue.value = '[]'
  }

  console.log('切换到编辑模式，初始化数据:', detailFromEdit.value)
}

// 监听detailsInputValue的变化并更新detailFromEdit
watch(detailsInputValue, (newVal) => {
  try {
    const parsedValue = JSON.parse(newVal)
    if (!detailFromEdit.value.value) {
      detailFromEdit.value.value = { value: [] }
    }
    detailFromEdit.value.value.value = parsedValue
    console.log('JSON输入更新了detailFromEdit:', detailFromEdit.value)
  } catch (error) {
    console.error('JSON解析错误:', error)
  }
}, { deep: true })

// 取消编辑
const cancelDetailsEdit = () => {
  isEditingDetails.value = false
  detailFromEdit.value = {}
  detailsInputValue.value = ''
}

// 保存编辑
const saveDetailsEdit = async () => {
  saveLoading.value = true

  console.log('保存前检查detailFromEdit:', JSON.stringify(detailFromEdit.value))
  console.log('保存前检查detailsInputValue:', detailsInputValue.value)

  // 检查数据是否有ID
  if (!detailFromEdit.value.ID) {
    console.error('错误：保存前数据缺少ID字段')
    ElMessage({
      type: 'error',
      message: '数据缺少ID，无法保存'
    })
    saveLoading.value = false
    return
  }

  try {
    // 确保JSON格式正确
    let parsedValue;
    try {
      parsedValue = JSON.parse(detailsInputValue.value)
    } catch (error) {
      console.error('JSON解析错误:', error)
      ElMessage({
        type: 'error',
        message: 'JSON格式错误，请检查输入'
      })
      saveLoading.value = false
      return
    }

    // 解析输入的JSON并包装成正确的结构
    detailFromEdit.value.value = {
      value: parsedValue
    }
    console.log('更新前检查数据ID:', detailFromEdit.value.ID)
    console.log('更新后的模板数据:', JSON.stringify(detailFromEdit.value))

    // 确保数据结构完整
    if (!detailFromEdit.value.value || typeof detailFromEdit.value.value !== 'object') {
      console.error('错误：模板内容格式不正确')
      ElMessage({
        type: 'error',
        message: '模板内容格式不正确'
      })
      saveLoading.value = false
      return
    }

    // 直接调用API
    const res = await updateThreeTucjetTemplate(detailFromEdit.value)
    console.log('API响应结果:', res)

    if (res.code === 0) {
      ElMessage({
        type: 'success',
        message: '更新成功'
      })

      // 更新详情数据
      detailFrom.value = JSON.parse(JSON.stringify(detailFromEdit.value))

      // 退出编辑模式
      isEditingDetails.value = false

      // 刷新表格数据
      getTableData()
    } else {
      ElMessage({
        type: 'error',
        message: res.msg || '保存失败'
      })
    }
  } catch (error) {
    console.error('保存过程中发生错误:', error)
    ElMessage({
      type: 'error',
      message: 'JSON格式错误或保存失败'
    })
  } finally {
    saveLoading.value = false
  }
}

// 更新JSON文本区域
const updateJSON = () => {
  if (detailFromEdit.value.value && detailFromEdit.value.value.value) {
    detailsInputValue.value = JSON.stringify(detailFromEdit.value.value.value, null, 2)
    console.log('可视化编辑更新了JSON:', detailsInputValue.value)
  }
}

// 更新formData的JSON文本区域
const updateFormDataJSON = () => {
  if (formData.value.value && formData.value.value.value) {
    inputValue.value = JSON.stringify(formData.value.value.value, null, 2)
    console.log('主编辑区可视化编辑更新了JSON:', inputValue.value)
  }
}

// 添加步骤到formData
const addStepToFormData = () => {
  if (!formData.value.value) {
    formData.value.value = { value: [] }
  }
  if (!Array.isArray(formData.value.value.value)) {
    formData.value.value.value = []
  }

  // 添加新步骤
  formData.value.value.value.push({
    name: `步骤 ${formData.value.value.value.length + 1}`,
    type: "input",
    index: formData.value.value.value.length,
    value: []
  })

  // 更新JSON
  updateFormDataJSON()
}

// 删除formData中的步骤
const removeStepFromFormData = (index) => {
  ElMessageBox.confirm('确定要删除这个步骤吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    if (Array.isArray(formData.value.value.value)) {
      formData.value.value.value.splice(index, 1)
      // 更新JSON
      updateFormDataJSON()
    }
  }).catch(() => { })
}

// 向formData中添加属性
const addPropertyToFormData = (obj) => {
  ElMessageBox.prompt('请输入属性名', '添加属性', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[^\s]+$/,
    inputErrorMessage: '属性名不能包含空格'
  }).then(({ value }) => {
    if (value && typeof obj === 'object') {
      obj[value] = ''
      // 更新JSON
      updateFormDataJSON()
    }
  }).catch(() => { })
}

// 从formData中删除属性
const removePropertyFromFormData = (obj, key) => {
  ElMessageBox.confirm(`确定要删除 ${keyToDisplay(key)} 属性吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    if (typeof obj === 'object' && obj !== null) {
      delete obj[key]
      // 更新JSON
      updateFormDataJSON()
    }
  }).catch(() => { })
}

// 向formData中添加数组项
const addArrayItemToFormData = (obj, key) => {
  if (Array.isArray(obj[key])) {
    // 根据数组中已有的项来决定添加什么类型
    const existingItems = obj[key]
    let newItem = ''

    if (existingItems.length > 0) {
      const lastItem = existingItems[existingItems.length - 1]
      // 复制上一个项的类型
      if (typeof lastItem === 'object' && lastItem !== null) {
        if (Array.isArray(lastItem)) {
          newItem = []
        } else {
          newItem = {}
          // 复制基本结构但不复制值
          Object.keys(lastItem).forEach(k => {
            if (typeof lastItem[k] === 'object' && lastItem[k] !== null) {
              newItem[k] = Array.isArray(lastItem[k]) ? [] : {}
            } else {
              newItem[k] = typeof lastItem[k] === 'boolean' ? false :
                typeof lastItem[k] === 'number' ? 0 : ''
            }
          })
        }
      } else if (typeof lastItem === 'number') {
        newItem = 0
      } else if (typeof lastItem === 'boolean') {
        newItem = false
      }
    }

    obj[key].push(newItem)
    // 更新JSON
    updateFormDataJSON()
  }
}

// 从formData中删除数组项
const removeArrayItemFromFormData = (obj, key, index) => {
  ElMessageBox.confirm('确定要删除这个项吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    if (Array.isArray(obj[key])) {
      obj[key].splice(index, 1)
      // 更新JSON
      updateFormDataJSON()
    }
  }).catch(() => { })
}

// 向formData中添加嵌套属性
const addNestedPropertyToFormData = (obj) => {
  ElMessageBox.prompt('请输入属性名', '添加属性', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[^\s]+$/,
    inputErrorMessage: '属性名不能包含空格'
  }).then(({ value }) => {
    if (value && typeof obj === 'object') {
      obj[value] = ''
      // 更新JSON
      updateFormDataJSON()
    }
  }).catch(() => { })
}

// 添加步骤
const addStep = () => {
  if (!detailFromEdit.value.value) {
    detailFromEdit.value.value = { value: [] }
  }
  if (!Array.isArray(detailFromEdit.value.value.value)) {
    detailFromEdit.value.value.value = []
  }

  // 添加新步骤
  detailFromEdit.value.value.value.push({
    name: `步骤 ${detailFromEdit.value.value.value.length + 1}`,
    type: "input",
    index: detailFromEdit.value.value.value.length,
    value: []
  })

  // 更新JSON
  updateJSON()
}

// 删除步骤
const removeStep = (index) => {
  ElMessageBox.confirm('确定要删除这个步骤吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    if (Array.isArray(detailFromEdit.value.value.value)) {
      detailFromEdit.value.value.value.splice(index, 1)
      // 更新JSON
      updateJSON()
    }
  }).catch(() => { })
}

// 添加属性
const addProperty = (obj) => {
  ElMessageBox.prompt('请输入属性名', '添加属性', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[^\s]+$/,
    inputErrorMessage: '属性名不能包含空格'
  }).then(({ value }) => {
    if (value && typeof obj === 'object') {
      obj[value] = ''
      // 更新JSON
      updateJSON()
    }
  }).catch(() => { })
}

// 删除属性
const removeProperty = (obj, key) => {
  ElMessageBox.confirm(`确定要删除 ${keyToDisplay(key)} 属性吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    if (typeof obj === 'object' && obj !== null) {
      delete obj[key]
      // 更新JSON
      updateJSON()
    }
  }).catch(() => { })
}

// 添加数组项
const addArrayItem = (obj, key) => {
  if (Array.isArray(obj[key])) {
    // 根据数组中已有的项来决定添加什么类型
    const existingItems = obj[key]
    let newItem = ''

    if (existingItems.length > 0) {
      const lastItem = existingItems[existingItems.length - 1]
      // 复制上一个项的类型
      if (typeof lastItem === 'object' && lastItem !== null) {
        if (Array.isArray(lastItem)) {
          newItem = []
        } else {
          newItem = {}
          // 复制基本结构但不复制值
          Object.keys(lastItem).forEach(k => {
            if (typeof lastItem[k] === 'object' && lastItem[k] !== null) {
              newItem[k] = Array.isArray(lastItem[k]) ? [] : {}
            } else {
              newItem[k] = typeof lastItem[k] === 'boolean' ? false :
                typeof lastItem[k] === 'number' ? 0 : ''
            }
          })
        }
      } else if (typeof lastItem === 'number') {
        newItem = 0
      } else if (typeof lastItem === 'boolean') {
        newItem = false
      }
    }

    obj[key].push(newItem)
    // 更新JSON
    updateJSON()
  }
}

// 删除数组项
const removeArrayItem = (obj, key, index) => {
  ElMessageBox.confirm('确定要删除这个项吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    if (Array.isArray(obj[key])) {
      obj[key].splice(index, 1)
      // 更新JSON
      updateJSON()
    }
  }).catch(() => { })
}

// 添加嵌套属性
const addNestedProperty = (obj) => {
  ElMessageBox.prompt('请输入属性名', '添加属性', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[^\s]+$/,
    inputErrorMessage: '属性名不能包含空格'
  }).then(({ value }) => {
    if (value && typeof obj === 'object') {
      obj[value] = ''
      // 更新JSON
      updateJSON()
    }
  }).catch(() => { })
}
</script>

<style>
.el-textarea__inner {
  height: 500px !important;
}

/* 模板内容显示样式 */
.template-content-display {
  max-height: 600px;
  overflow-y: auto;
  padding: 10px;
}

.template-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.template-step {
  border: 1px solid var(--el-border-color-light, #dcdfe6);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  background-color: var(--el-bg-color, #fff);
  transition: all 0.3s;
}

.template-step:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.step-header {
  background-color: var(--el-color-primary-light-9, #ecf5ff);
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-light, #dcdfe6);
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-number {
  font-weight: bold;
  color: var(--el-color-primary, #409eff);
}

.step-title-container {
  flex: 1;
  display: flex;
  align-items: center;
}

.step-actions {
  display: flex;
  gap: 8px;
}

.step-body {
  padding: 12px 16px;
}

.step-item {
  display: flex;
  margin-bottom: 8px;
  line-height: 1.5;
  flex-wrap: wrap;
  border-bottom: 1px dashed var(--el-border-color-lighter, #ebeef5);
  padding-bottom: 6px;
}

.step-item:last-child {
  border-bottom: none;
}

.step-key {
  min-width: 120px;
  font-weight: 600;
  color: var(--el-text-color-regular, #606266);
  margin-right: 8px;
}

.step-value {
  flex: 1;
  color: var(--el-text-color-primary, #303133);
  word-break: break-word;
}

.step-value .type-hint {
  color: var(--el-color-info, #909399);
  font-size: 0.9em;
  margin-right: 4px;
}

.step-value .value-content {
  color: var(--el-color-primary-dark-2, #337ecc);
}

.empty-template {
  padding: 30px;
  display: flex;
  justify-content: center;
}

/* 新增复杂数据展示样式 */
.complex-toggle {
  cursor: pointer;
  font-weight: bold;
  color: var(--el-color-primary, #409eff);
  margin-left: 8px;
  padding: 0 4px;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.complex-toggle:hover {
  background-color: var(--el-color-primary-light-8, #ecf5ff);
}

.complex-content {
  margin-top: 8px;
  margin-left: 8px;
  padding: 8px;
  border-left: 2px solid var(--el-color-primary-light-5, #a0cfff);
  background-color: var(--el-color-primary-light-9, #ecf5ff);
  border-radius: 4px;
}

.array-item {
  display: flex;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px dotted var(--el-border-color-light, #e4e7ed);
}

.array-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.array-index {
  font-weight: 600;
  color: var(--el-color-warning-dark-2, #cf9236);
  min-width: 40px;
  margin-right: 8px;
}

.array-value {
  flex: 1;
}

.object-display {
  padding: 4px 0;
}

.object-property {
  display: flex;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px dotted var(--el-border-color-light, #e4e7ed);
}

.object-property:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.property-key {
  font-weight: 600;
  color: var(--el-color-success-dark-2, #529b2e);
  min-width: 120px;
  margin-right: 8px;
}

.property-value {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.property-value .type-hint {
  margin-right: 8px;
}

/* 添加对象嵌套显示的样式 */
.object-nested {
  padding: 4px 0;
}

.nested-property {
  display: flex;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px dotted var(--el-border-color-light, #e4e7ed);
}

.nested-property:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

/* 调整属性名和值的样式 */
.property-key {
  font-weight: 600;
  color: var(--el-color-success-dark-2, #529b2e);
  min-width: 120px;
  margin-right: 8px;
}

.property-value {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.property-value .type-hint {
  margin-right: 8px;
}

/* 添加对象名称显示 */
.object-name {
  color: var(--el-color-warning-dark-2, #cf9236);
  font-weight: 600;
  margin: 0 8px;
  font-style: italic;
}

.object-title {
  color: var(--el-color-primary-dark-2, #337ecc);
  font-weight: 600;
  margin: 0 8px;
  font-style: italic;
}
</style>
