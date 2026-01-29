<template>
    <div class="box" v-if="visible" @click.stop="handleContainerClick">
        <div class="box-header">
            <h2>线缆面板</h2>
        </div>
        <div class="box-background"></div>
        <div class="box-content">
            <div v-for="(cable, index) in cableList" :key="index" 
                class="cable-item" 
                :class="{'cable-item-active': activeCableId === cable.id}"
                @click="handleCableClick(cable)">
                <div class="select-indicator" v-if="activeCableId === cable.id">
                    <span class="indicator-dot"></span>
                    <span>当前选中</span>
                </div>
                <h3>{{ cable.name }}</h3>
                <div class="cable-info">
                    <div class="room-list">
                        <span>所在配电室: </span>
                        <span v-for="(room, roomIndex) in cable.roomList" :key="roomIndex" class="room-tag">
                            {{ room }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import EventBus from '@/bus';
import { cableConfig } from '@/config/cableConfig';
import * as THREE from 'three';

// 确保THREE正确加载
console.log('THREE版本:', THREE.REVISION);

export default {
    name: 'cable',
    components: {},
    props: {},
    data() {
        return {
            visible: false,
            cableList: [],
            activeCableId: null,
            lastHighlightedModels: null,
            materialBeforeCable: null
        };
    },
    methods: {
        handleContainerClick(event) {
            event.stopPropagation();
        },
        // 创建一个公共方法用于应用暗色线框材质
        applyDarkWireframeMaterial() {
            console.log('应用暗色线框材质');
            
            if (!window.app || !window.app.model) {
                console.error('app或model不存在，无法应用暗色线框材质');
                return;
            }
            
            // 创建一个暗色版本的线框材质 - 与loaderParkElectricity中的定义保持一致
            const darkWireframeMaterial = new THREE.MeshBasicMaterial({
                color: 0x003344, // 深蓝色，比原来的颜色更暗
                transparent: true,
                opacity: 0.05, // 降低不透明度
                wireframe: true
            });
            
            // 创建一个集合来跟踪已处理的对象
            const processedObjects = new Set();
            
            // 应用暗色线框材质到非线缆模型
            window.app.model.traverse((obj) => {
                if (!obj.isMesh || processedObjects.has(obj.uuid)) return;
                
                processedObjects.add(obj.uuid);
                
                // 隐藏车流线模型
                if (obj.name.indexOf('车流线') > -1 || 
                    obj.name == "平面017_1" || 
                    obj.name == "平面017_2" || 
                    obj.name == "平面017_3" || 
                    obj.name == "平面017_4") {
                    obj.visible = false;
                }
                // 对非线缆和非电表模型应用暗色线框材质
                else if (obj.name.toLowerCase().indexOf('线缆') === -1 && 
                         obj.name.toLowerCase().indexOf('电表') === -1) {
                    // 如果没有保存原始材质，则保存
                    if (!obj.userData.originalMaterial) {
                        obj.userData.originalMaterial = obj.material;
                    }
                    // 应用暗色线框材质
                    obj.material = darkWireframeMaterial.clone(); // 使用克隆的材质，避免共享
                }
                // 确保线缆模型可见，但不改变其材质
                else if (obj.name.toLowerCase().indexOf('线缆') > -1) {
                    obj.visible = true;
                    
                    // 如果线缆模型当前不是高亮状态，则保存其原始材质
                    if (!obj.userData.isHighlighted && !obj.userData.originalMaterial) {
                        obj.userData.originalMaterial = obj.material;
                    }
                }
            });
            
            console.log('暗色线框材质应用完成');
        },
        handleCableClick(cable) {
            console.log('点击线缆:', cable);
            
            try {
                // 完全重置所有材质到初始状态，然后重新应用暗色线框效果
                this.resetAllMaterials();
                
                // 设置当前活动的线缆ID
                this.activeCableId = cable.id;
                
                // 注意：不需要再次调用applyDarkWireframeMaterial，因为resetAllMaterials已经调用了
                
                // 高亮显示对应的线缆模型
                if (cable.Cacheodel && Array.isArray(cable.Cacheodel)) {
                    console.log('高亮线缆模型:', cable.Cacheodel);
                    this.highlightCableModels(cable.Cacheodel);
                    this.lastHighlightedModels = cable.Cacheodel;
                } else {
                    console.error('线缆模型数据不正确:', cable.Cacheodel);
                }
                
                // 高亮显示关联的配电室模型
                if (cable.roomList && Array.isArray(cable.roomList)) {
                    console.log('高亮配电室模型:', cable.roomList);
                    this.highlightPowerRooms(cable.roomList);
                }
                
                // 使用flyTo飞到对应的位置
                if (cable.camera && cable.camera.position && cable.camera.target) {
                    console.log('飞行到位置:', cable.camera);
                    try {
                        // 使用setTimeout延迟执行flyTo，避免与材质更新冲突
                        setTimeout(() => {
                            window.app.flyTo({
                                position: [
                                    cable.camera.position.x,
                                    cable.camera.position.y,
                                    cable.camera.position.z
                                ],
                                controls: [
                                    cable.camera.target.x,
                                    cable.camera.target.y,
                                    cable.camera.target.z
                                ],
                                duration: 1000
                            });
                        }, 100);
                    } catch (error) {
                        console.error('飞行过程中出错:', error);
                    }
                } else {
                    console.error('相机数据不正确:', cable.camera);
                }
            } catch (error) {
                console.error('处理线缆点击事件时出错:', error);
            }
        },
        cleanupAllEffects() {
            console.log('清理所有特效 - 开始');
            
            if (!window.app || !window.app.model) {
                console.error('app或model不存在，无法清理特效');
                return;
            }
            
            // 1. 清空cableHighlightedObjects数组
            if (window.app.cableHighlightedObjects) {
                window.app.cableHighlightedObjects = [];
            }
            
            // 2. 清空blinkObjects数组
            if (window.app.blinkObjects) {
                window.app.blinkObjects = [];
            }
            
            // 3. 清空selectedObjects数组
            if (window.app.selectedObjects) {
                window.app.selectedObjects = [];
                
                // 更新outlinePass
                if (window.app.outlinePass) {
                    window.app.outlinePass.selectedObjects = [];
                }
            }
            
            // 4. 清空lastHighlightedModels引用
            this.lastHighlightedModels = null;
            
            console.log('清理所有特效 - 完成');
        },
        highlightCableModels(modelNames) {
            if (!modelNames || !Array.isArray(modelNames)) {
                console.error('模型名称不是数组:', modelNames);
                return;
            }
            
            console.log('开始高亮模型:', modelNames);
            
            // 注意：不再在这里调用cleanupAllEffects，因为handleCableClick已经调用过了
            // 这样可以避免重复清理和重置
            
            // 高亮显示选中的线缆模型
            if (window.app && window.app.model) {
                let foundModels = 0;
                
                // 创建一个更明显的高亮材质，使用更亮的颜色和更高的不透明度
                const highlightMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff6600, // 更亮的橙色
                    transparent: true,
                    opacity: 1.0,
                    side: THREE.DoubleSide
                });
                
                // 标记这是一个高亮材质，便于后续识别和清理
                highlightMaterial.userData = { isHighlightMaterial: true };
                
                // 确保cableHighlightedObjects数组存在
                if (!window.app.cableHighlightedObjects) {
                    window.app.cableHighlightedObjects = [];
                }
                
                // 创建一个集合来跟踪已处理的模型名称
                const processedNames = new Set();
                
                // 第一次遍历：使用精确匹配



                window.app.model.traverse((obj) => {
                    if (!obj.isMesh || obj.userData.isHighlighted) return;
                    
                    // 检查模型名称是否精确匹配任何目标线缆名称
                    const matchedName = modelNames.find(cableName => 
                        obj.name.toLowerCase() === cableName.toLowerCase()
                    );
                    
                    if (matchedName) {
                        processedNames.add(matchedName.toLowerCase());
                        foundModels++;
                        console.log('精确匹配找到线缆模型:', obj.name);
                        
                        this.applyHighlightToModel(obj, highlightMaterial.clone());
                    }
                });
                

                // 第二次遍历：使用包含匹配
                window.app.model.traverse((obj) => {
                    if (!obj.isMesh || obj.userData.isHighlighted) return;
                    
                    // 检查模型名称是否包含任何未处理的目标线缆名称
                    const matchedName = modelNames.find(cableName => 
                        !processedNames.has(cableName.toLowerCase()) && 
                        obj.name.toLowerCase().includes(cableName.toLowerCase())

                    );
                    
                    if (matchedName) {
                        processedNames.add(matchedName.toLowerCase());
                        foundModels++;
                        console.log('精确匹配找到线缆模型:', obj.name);
                        
                        this.applyHighlightToModel(obj, highlightMaterial.clone());
                    }
                });
                

                // 第二次遍历：使用包含匹配
                window.app.model.traverse((obj) => {
                    if (!obj.isMesh || obj.userData.isHighlighted) return;
                    
                    // 检查模型名称是否包含任何未处理的目标线缆名称
                    const matchedName = modelNames.find(cableName => 
                        !processedNames.has(cableName.toLowerCase()) && 
                        obj.name.toLowerCase().includes(cableName.toLowerCase())

                    );
                    
                    if (matchedName) {
                        processedNames.add(matchedName.toLowerCase());
                        foundModels++;
                        console.log('精确匹配找到线缆模型:', obj.name);
                        
                        this.applyHighlightToModel(obj, highlightMaterial.clone());
                    }
                });
                

                // 第二次遍历：使用包含匹配
                window.app.model.traverse((obj) => {
                    if (!obj.isMesh || obj.userData.isHighlighted) return;
                    
                    // 检查模型名称是否包含任何未处理的目标线缆名称
                    const matchedName = modelNames.find(cableName => 
                        !processedNames.has(cableName.toLowerCase()) && 
                        obj.name.toLowerCase().includes(cableName.toLowerCase())
                    );
                    
                    if (matchedName) {
                        processedNames.add(matchedName.toLowerCase());
                        foundModels++;
                        console.log('精确匹配找到线缆模型:', obj.name);
                        
                        this.applyHighlightToModel(obj, highlightMaterial.clone());
                    }
                });
                
                // 第二次遍历：使用包含匹配
                window.app.model.traverse((obj) => {
                    if (!obj.isMesh || obj.userData.isHighlighted) return;
                    
                    // 检查模型名称是否包含任何未处理的目标线缆名称
                    const matchedName = modelNames.find(cableName => 
                        !processedNames.has(cableName.toLowerCase()) && 
                        obj.name.toLowerCase().includes(cableName.toLowerCase())
                    );
                    
                    if (matchedName) {
                        processedNames.add(matchedName.toLowerCase());
                        foundModels++;
                        console.log('包含匹配找到线缆模型:', obj.name);
                        
                        this.applyHighlightToModel(obj, highlightMaterial.clone());
                    }
                });
                

                // 第三次遍历：使用数字匹配（如果仍有未处理的名称）
                if (modelNames.some(name => !processedNames.has(name.toLowerCase()))) {
                    window.app.model.traverse((obj) => {
                        if (!obj.isMesh || obj.userData.isHighlighted || !obj.name.toLowerCase().includes('线缆')) return;
                        
                        // 提取模型名称中的数字
                        const objNumbers = obj.name.match(/\d+/g);
                        
                        // 检查是否有未处理的线缆名称与此模型的数字匹配
                        const matchedName = modelNames.find(cableName => {
                            if (processedNames.has(cableName.toLowerCase())) return false;
                            
                            const cableNumbers = cableName.match(/\d+/g);
                            return cableNumbers && objNumbers && 
                                   objNumbers.some(num => cableNumbers.includes(num));
                        });
                        
                        if (matchedName) {
                            processedNames.add(matchedName.toLowerCase());
                            foundModels++;
                            console.log('数字匹配找到线缆模型:', obj.name, '匹配:', matchedName);
                            
                            this.applyHighlightToModel(obj, highlightMaterial.clone());
                        }
                    });
                }
                
                // 最后一次尝试：如果仍然没有找到任何模型，尝试匹配任何包含"线缆"的模型
                if (foundModels === 0) {
                    console.warn('未找到任何匹配的线缆模型! 尝试匹配任何线缆模型...');
                    
                    window.app.model.traverse((obj) => {
                        if (!obj.isMesh || obj.userData.isHighlighted) return;
                        
                        if (obj.name.toLowerCase().includes('线缆')) {
                            foundModels++;
                            console.log('通用匹配找到线缆模型:', obj.name);
                            
                            this.applyHighlightToModel(obj, highlightMaterial.clone());
                        }
                    });
                }
                
                console.log('共找到线缆模型数量:', foundModels);
                if (foundModels === 0) {
                    console.error('所有匹配方法都失败，未找到任何线缆模型!');
                }
            } else {
                console.error('app或model不存在!');
            }
        },
        
        // 新增辅助方法，用于应用高亮效果到模型
        applyHighlightToModel(obj, highlightMaterial) {
            try {
                // 保存原始材质（如果尚未保存）
                if (!obj.userData.originalMaterial) {
                    // 尝试克隆材质而不是直接引用
                    try {
                        if (obj.material.clone) {
                            obj.userData.originalMaterial = obj.material.clone();
                            // 确保克隆的材质包含所有必要的纹理和属性
                            if (obj.material.map) obj.userData.originalMaterial.map = obj.material.map;
                            if (obj.material.envMap) obj.userData.originalMaterial.envMap = obj.material.envMap;
                            if (obj.material.lightMap) obj.userData.originalMaterial.lightMap = obj.material.lightMap;
                            obj.userData.originalMaterial.needsUpdate = true;
                        } else {
                            obj.userData.originalMaterial = obj.material;
                        }
                    } catch (error) {
                        console.error('克隆材质时出错:', error);
                        // 出错时直接保存引用
                        obj.userData.originalMaterial = obj.material;
                    }
                    console.log('保存原始材质:', obj.name);
                }
                
                // 应用高亮材质 - 确保每个对象都有自己的高亮材质实例
                highlightMaterial.userData = { isHighlightMaterial: true };
                highlightMaterial.needsUpdate = true;
                obj.material = highlightMaterial;
                
                // 标记对象为高亮状态
                obj.userData.isHighlighted = true;
                
                // 确保线缆模型可见
                obj.visible = true;
                
                // 将对象添加到app.cableHighlightedObjects数组中，便于后续清理
                if (!window.app.cableHighlightedObjects) {
                    window.app.cableHighlightedObjects = [];
                }
                
                if (!window.app.cableHighlightedObjects.includes(obj)) {
                    window.app.cableHighlightedObjects.push(obj);
                    console.log('添加到cableHighlightedObjects:', obj.name);
                }
            } catch (error) {
                console.error('设置高亮材质时出错:', error, obj);
            }
        },
        resetCableModels(modelNames) {
            console.log('重置线缆模型:', modelNames);
            // 重置指定的线缆模型的材质
            if (window.app && window.app.model) {
                let resetCount = 0;
                
                // 如果存在cableHighlightedObjects数组，优先使用它
                if (window.app.cableHighlightedObjects && window.app.cableHighlightedObjects.length > 0) {
                    console.log('使用cableHighlightedObjects数组重置模型');
                    
                    // 创建一个副本，因为我们会在遍历过程中修改数组
                    const objectsToReset = [...window.app.cableHighlightedObjects];
                    
                    objectsToReset.forEach(obj => {
                        if (obj && obj.isMesh) {
                            // 如果有保存原始材质，则恢复
                            if (obj.userData.originalMaterial) {
                                try {
                                    obj.material = obj.userData.originalMaterial;
                                    delete obj.userData.originalMaterial;
                                    delete obj.userData.isHighlighted;
                                    resetCount++;
                                } catch (error) {
                                    console.error('重置材质时出错:', error);
                                }
                            }
                            
                            // 从数组中移除
                            const index = window.app.cableHighlightedObjects.indexOf(obj);
                            if (index !== -1) {
                                window.app.cableHighlightedObjects.splice(index, 1);
                            }
                        }
                    });
                } 
                // 如果没有cableHighlightedObjects数组或它是空的，使用modelNames
                else if (modelNames && modelNames.length > 0) {
                    console.log('使用modelNames重置模型:', modelNames);
                    
                    window.app.model.traverse((obj) => {
                        // 使用更灵活的匹配方式
                        const isTargetCable = modelNames.some(cableName => 
                            obj.name.toLowerCase().includes(cableName.toLowerCase())
                        );
                        
                        const hasHighlightMaterial = obj.material && 
                                                    obj.material.userData && 
                                                    obj.material.userData.isHighlightMaterial;
                        
                        if (obj.isMesh && (isTargetCable || hasHighlightMaterial)) {
                            // 如果有保存原始材质，则恢复
                            if (obj.userData.originalMaterial) {
                                try {
                                    obj.material = obj.userData.originalMaterial;
                                    delete obj.userData.originalMaterial;
                                    delete obj.userData.isHighlighted;
                                    resetCount++;
                                } catch (error) {
                                    console.error('重置材质时出错:', error);
                                }
                            }
                        }
                    });
                }
                // 如果没有指定模型名称，尝试重置所有带有高亮标记的模型
                else {
                    console.log('尝试重置所有带有高亮标记的模型');
                    
                    window.app.model.traverse((obj) => {
                        if (obj.isMesh && (obj.userData.isHighlighted || 
                            (obj.material && obj.material.userData && obj.material.userData.isHighlightMaterial))) {
                            // 如果有保存原始材质，则恢复
                            if (obj.userData.originalMaterial) {
                                try {
                                    obj.material = obj.userData.originalMaterial;
                                    delete obj.userData.originalMaterial;
                                    delete obj.userData.isHighlighted;
                                    resetCount++;
                                } catch (error) {
                                    console.error('重置材质时出错:', error);
                                }
                            }
                        }
                    });
                }
                
                console.log('重置了', resetCount, '个线缆模型');
            } else {
                console.error('app或model不存在，无法重置线缆模型');
            }
            
            // 创建一个暗色版本的线框材质 - 与loaderParkElectricity中的定义保持一致
            const darkWireframeMaterial = new THREE.MeshBasicMaterial({
                color: 0x003344, // 深蓝色，比原来的颜色更暗
                transparent: true,
                opacity: 0.05, // 降低不透明度
                wireframe: true
            });
            
            // 确保车流线模型保持隐藏并重新应用暗色线框材质
            if (window.app && window.app.model) {
                window.app.model.traverse((obj) => {
                    if (obj.isMesh) {
                        // 隐藏车流线模型
                        if (obj.name.indexOf('车流线') > -1 || 
                            obj.name == "平面017_1" || 
                            obj.name == "平面017_2" || 
                            obj.name == "平面017_3" || 
                            obj.name == "平面017_4") {
                            obj.visible = false;
                        }
                        // 对非线缆和非电表模型应用暗色线框材质
                        else if (obj.name.toLowerCase().indexOf('线缆') === -1 && 
                                 obj.name.toLowerCase().indexOf('电表') === -1) {
                            // 如果没有保存原始材质，则保存
                            if (!obj.userData.originalMaterial) {
                                obj.userData.originalMaterial = obj.material;
                            }
                            // 应用暗色线框材质
                            obj.material = darkWireframeMaterial.clone(); // 使用克隆的材质，避免共享
                        }
                        // 确保线缆模型可见，但不改变其材质
                        else if (obj.name.toLowerCase().indexOf('线缆') > -1) {
                            obj.visible = true;
                        }
                    }
                });
            }
        },
        showCablePanel() {
            console.log('显示线缆面板');
            
            // 保存当前所有模型的材质状态
            this.materialBeforeCable = {};
            if (window.app && window.app.model) {
                window.app.model.traverse((obj) => {
                    if (obj.isMesh) {
                        // 深度克隆材质，确保保存完整的材质状态
                        let clonedMaterial;
                        try {
                            // 尝试克隆材质
                            if (obj.material.clone) {
                                clonedMaterial = obj.material.clone();
                            } else {
                                // 如果无法克隆，保存引用
                                clonedMaterial = obj.material;
                            }
                            
                            // 确保克隆后的材质与原始材质保持一定属性一致
                            if (clonedMaterial !== obj.material) {
                                clonedMaterial.needsUpdate = true;
                                
                                // 复制一些通常不会被自动克隆的属性
                                if (obj.material.map) clonedMaterial.map = obj.material.map;
                                if (obj.material.envMap) clonedMaterial.envMap = obj.material.envMap;
                                if (obj.material.lightMap) clonedMaterial.lightMap = obj.material.lightMap;
                            }
                            
                            this.materialBeforeCable[obj.uuid] = {
                                material: clonedMaterial,
                                visible: obj.visible
                            };
                        } catch (error) {
                            console.error('克隆材质时出错:', error, obj);
                            // 出错时保存引用
                            this.materialBeforeCable[obj.uuid] = {
                                material: obj.material,
                                visible: obj.visible
                            };
                        }
                    }
                });
                console.log('保存了', Object.keys(this.materialBeforeCable).length, '个模型的材质状态');
            }
            
            // 应用暗色线框材质
            this.applyDarkWireframeMaterial();
            
            this.visible = true;
            this.cableList = cableConfig;
            console.log('线缆列表:', this.cableList);
        },
        hideCablePanel() {
            console.log('隐藏线缆面板');
            this.visible = false;
            this.activeCableId = null;
            
            // 清理所有闪烁效果和高亮效果
            this.resetAllMaterials();
            
            // 遍历所有模型并恢复初始材质状态
            if (window.app && window.app.model && this.materialBeforeCable) {
                console.log('恢复初始材质状态');
                window.app.model.traverse((obj) => {
                    if (obj.isMesh && this.materialBeforeCable[obj.uuid]) {
                        const savedState = this.materialBeforeCable[obj.uuid];
                        obj.material = savedState.material;
                        obj.visible = savedState.visible;
                    }
                });
                console.log('恢复了', Object.keys(this.materialBeforeCable).length, '个模型的材质状态');
            }
            
            // 清空保存的材质状态
            this.materialBeforeCable = null;
            
            // 最后调用setModelDefaultMatrial确保所有材质都被正确恢复
            try {
                const { setModelDefaultMatrial } = require('@/three/loaderModel');
                setModelDefaultMatrial(window.app);
            } catch (error) {
                console.error('调用setModelDefaultMatrial时出错:', error);
            }
        },
        highlightPowerRooms(roomList) {
            if (!roomList || !Array.isArray(roomList)) {
                console.error('配电室列表不是数组:', roomList);
                return;
            }
            
            console.log('开始高亮配电室模型:', roomList);
            
            // 查找配电室模型并应用闪烁效果
            if (window.app && window.app.model) {
                let foundRooms = 0;
                
                window.app.model.traverse((obj) => {
                    // 检查模型名称是否包含roomList中的任何配电室名称
                    const isTargetRoom = roomList.some(roomName => 
                        obj.name.toLowerCase().includes(roomName.toLowerCase()) && 
                        obj.name.includes('配电室')
                    );
                    
                    if (obj.isMesh && isTargetRoom) {
                        foundRooms++;
                        console.log('找到配电室模型:', obj.name);
                        
                        try {
                            // 保存原始材质（如果尚未保存）
                            if (!obj.userData.originalMaterial) {
                                obj.userData.originalMaterial = obj.material;
                            }
                            
                            // 创建闪烁效果
                            this.createBlinkEffect(obj);
                            
                            // 将模型添加到app.selectedObjects数组中，以便使用outlinePass效果
                            if (window.app.selectedObjects && !window.app.selectedObjects.includes(obj)) {
                                window.app.selectedObjects.push(obj);
                                
                                // 更新outlinePass
                                if (window.app.outlinePass) {
                                    window.app.outlinePass.selectedObjects = window.app.selectedObjects;
                                }
                            }
                        } catch (error) {
                            console.error('设置配电室高亮效果时出错:', error);
                        }
                    }
                });
                
                console.log('共找到配电室模型数量:', foundRooms);
                if (foundRooms === 0) {
                    console.warn('未找到任何匹配的配电室模型!');
                }
            } else {
                console.error('app或model不存在!');
            }
        },
        
        createBlinkEffect(obj) {
            // 创建一个闪烁的发光材质
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0x00aaff,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            
            // 标记这是一个闪烁材质，便于后续识别和清理
            glowMaterial.userData = { isBlinkMaterial: true };
            
            // 保存原始材质（如果尚未保存）
            if (!obj.userData.originalMaterial) {
                obj.userData.originalMaterial = obj.material;
            }
            
            // 应用发光材质
            obj.material = glowMaterial;
            
            // 设置闪烁动画
            if (!window.app.renderTasks) {
                window.app.renderTasks = {};
            }
            
            // 为每个对象创建唯一的任务ID
            const taskId = `blink_${obj.id}`;
            
            // 移除可能存在的旧任务
            if (window.app.renderTasks[taskId]) {
                this.$EventBus.$emit('removeRenderTask', taskId);
                delete window.app.renderTasks[taskId];
            }
            
            // 创建闪烁动画函数
            let time = 0;
            const blinkFunc = () => {
                time += 0.05;
                const blinkValue = Math.sin(time) * 0.4 + 0.6; // 0.2-1.0范围内闪烁
                
                if (obj && obj.material) {
                    // 更新材质颜色亮度
                    const color = new THREE.Color(0x00aaff);
                    color.multiplyScalar(blinkValue);
                    obj.material.color = color;
                    
                    // 更新不透明度
                    obj.material.opacity = blinkValue;
                }
            };
            
            // 添加到渲染任务
            window.app.renderTasks[taskId] = blinkFunc;
            this.$EventBus.$emit('addRenderTask', taskId, blinkFunc);
            
            // 保存任务ID到对象中，以便后续清理
            obj.userData.blinkTaskId = taskId;
            
            // 将对象添加到app.blinkObjects数组中，便于后续清理
            if (!window.app.blinkObjects) {
                window.app.blinkObjects = [];
            }
            if (!window.app.blinkObjects.includes(obj)) {
                window.app.blinkObjects.push(obj);
            }
        },
        resetAllMaterials() {
            console.log('彻底重置所有材质到初始状态');
            
            if (!window.app || !window.app.model) {
                console.error('app或model不存在，无法重置所有材质');
                return;
            }
            
            // 1. 首先移除所有闪烁渲染任务
            if (window.app.renderTasks) {
                Object.keys(window.app.renderTasks).forEach(taskId => {
                    if (taskId.startsWith('blink_') || taskId === 'cableAnimation') {
                        console.log('移除渲染任务:', taskId);
                        this.$EventBus.$emit('removeRenderTask', taskId);
                        delete window.app.renderTasks[taskId];
                    }
                });
            }
            
            // 2. 清空tracking数组
            if (window.app.cableHighlightedObjects) {
                window.app.cableHighlightedObjects = [];
            }
            
            if (window.app.blinkObjects) {
                window.app.blinkObjects = [];
            }
            
            if (window.app.selectedObjects) {
                window.app.selectedObjects = [];
                if (window.app.outlinePass) {
                    window.app.outlinePass.selectedObjects = [];
                }
            }
            
            // 3. 彻底清理所有对象的材质状态 - 直接重置所有mesh
            console.log('彻底重置所有模型的材质状态');
            window.app.model.traverse((obj) => {
                if (obj.isMesh) {
                    // 清除所有相关状态
                    delete obj.userData.isHighlighted;
                    delete obj.userData.blinkTaskId;
                    
                    // 恢复到原始状态，不依赖originalMaterial
                    if (this.materialBeforeCable && this.materialBeforeCable[obj.uuid]) {
                        const savedState = this.materialBeforeCable[obj.uuid];
                        // 只复制材质，保留当前的可见性状态，避免闪烁
                        obj.material = savedState.material;
                    } else if (obj.userData.originalMaterial) {
                        // 如果有originalMaterial但没有在materialBeforeCable中
                        obj.material = obj.userData.originalMaterial;
                        delete obj.userData.originalMaterial;
                    }
                }
            });
            
            // 4. 重新应用暗色线框材质，确保界面一致性
            this.applyDarkWireframeMaterial();
            
            // 5. 清空lastHighlightedModels引用
            this.lastHighlightedModels = null;
            
            console.log('所有材质彻底重置完成');
        }
    },
    mounted() {
        // 监听显示/隐藏事件
        console.log('cable组件挂载，设置事件监听');
        try {
            this.$EventBus.$on('showCable', (show) => {
                console.log('接收到showCable事件:', show);
                if (show) {
                    console.log("显示")
                    this.showCablePanel();
                } else {
                    this.hideCablePanel();
                }
            });
        } catch (error) {
            console.error('设置事件监听时出错:', error);
        }
    },
    beforeDestroy() {
        // 组件销毁前移除事件监听
        console.log('cable组件销毁，移除事件监听');
        try {
            this.$EventBus.$off('showCable');
        } catch (error) {
            console.error('移除事件监听时出错:', error);
        }
    }
};
</script>

<style lang="less" scoped>
.box {
    position: fixed;
    top: 120px;
    left: 20px;
    width: 500px;
    height: 80%;
    z-index: 1000;
    position: relative;

    .box-header {
        width: 100%;
        height: 60px;
        background: url('~@/assets/image/header.png') no-repeat center center;
        background-size: 100% 100%;
        text-align: center;

        h2 {
            color: #bde4ff;
            font-size: 24px;
            line-height: 60px;
            letter-spacing: 5px;
            margin: 0;
        }
    }

    .box-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url('~@/assets/image/card_bg.png');
        background-size: cover;
        background-position: center;
        z-index: -1;
    }

    .box-content {
        position: relative;
        width: 100%;
        height: calc(100% - 60px);
        padding: 20px;
        box-sizing: border-box;
        overflow-y: auto;
        overflow-x: hidden;
        
        // 自定义滚动条样式
        &::-webkit-scrollbar {
            width: 8px;
        }
        
        &::-webkit-scrollbar-track {
            background: rgba(0, 30, 60, 0.3);
            border-radius: 4px;
        }
        
        &::-webkit-scrollbar-thumb {
            background: rgba(10, 132, 255, 0.5);
            border-radius: 4px;
            transition: all 0.3s ease;
            
            &:hover {
                background: rgba(10, 132, 255, 0.8);
            }
        }
        
        // 添加滚动条阴影效果
        &::-webkit-scrollbar-thumb:active {
            background: rgba(10, 132, 255, 1);
            box-shadow: 0 0 10px rgba(10, 132, 255, 0.5);
        }
    }

    .cable-item {
        margin-bottom: 20px;
        width: 90%;
        padding: 15px;
        background: rgba(0, 30, 60, 0.7);
        border: 1px solid #0a84ff;
        border-radius: 5px;
        cursor: pointer;
        position: relative;
        transition: all 0.3s ease, border 0.2s ease, box-shadow 0.3s ease;

        &:hover {
            background: rgba(10, 132, 255, 0.2);
            transform: translateY(-2px);
        }

        h3 {
            color: #bde4ff;
            text-align: center;
            margin-bottom: 10px;
            font-size: 22px;
            transition: color 0.3s ease, text-shadow 0.3s ease;
        }

        .cable-info {
            color: #ffffff;
            font-size: 16px;

            .room-list {
                display: flex;
                flex-wrap: wrap;
                margin-top: 10px;

                .room-tag {
                    background: rgba(10, 132, 255, 0.3);
                    padding: 2px 8px;
                    border-radius: 4px;
                    margin-right: 8px;
                    margin-bottom: 5px;
                    transition: background 0.3s ease;
                }
            }
        }
    }
    
    .cable-item-active {
        background: rgba(10, 132, 255, 0.4);
        border: 2px solid #00ffff;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
        transform: translateY(-2px);
        
        h3 {
            color: #ffffff;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
        }
        
        &:before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, rgba(0, 255, 255, 0.1), transparent);
            border-radius: 5px;
        }
        
        .room-tag {
            background: rgba(0, 255, 255, 0.3) !important;
        }
    }
    
    .select-indicator {
        position: absolute;
        top: -10px;
        right: 10px;
        background: #00ffff;
        color: #001428;
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        animation: pulse 1.5s infinite;
        
        .indicator-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #001428;
            border-radius: 50%;
            margin-right: 5px;
            animation: blink 1s infinite;
        }
    }
    
    @keyframes pulse {
        0% {
            box-shadow: 0 0 0 0 rgba(0, 255, 255, 0.7);
        }
        70% {
            box-shadow: 0 0 0 6px rgba(0, 255, 255, 0);
        }
        100% {
            box-shadow: 0 0 0 0 rgba(0, 255, 255, 0);
        }
    }
    
    @keyframes blink {
        0% {
            opacity: 0.2;
        }
        50% {
            opacity: 1;
        }
        100% {
            opacity: 0.2;
        }
    }
}
</style>
