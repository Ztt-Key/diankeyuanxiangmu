import * as THREE from 'three';

// 存储原始材质和动画ID
const originalMaterials = new Map();
let glowAnimationId = null;

/**
 * 为配电室模型添加发光效果
 * @param {*} app 
 */
export function addGlowEffectToPowerRoom(app) {
  // 清除可能存在的旧动画
  if (glowAnimationId) {
    cancelAnimationFrame(glowAnimationId);
    glowAnimationId = null;
  }
  
  // 查找所有配电室模型
  const powerRooms = [];
  app.model.traverse((obj) => {


    if (obj.isMesh && obj.name.indexOf('配电室') !== -1) {
      powerRooms.push(obj);
      
      // 保存原始材质
      if (!originalMaterials.has(obj.id)) {
        originalMaterials.set(obj.id, obj.material);
      }
      
      // 创建发光材质
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
      });
      
      // 应用发光材质
      obj.material = glowMaterial;
    }
  });
  
  // 如果没有找到配电室模型，直接返回
  if (powerRooms.length === 0) return;
  
  // 创建闪烁动画
  let intensity = 0;
  let increasing = true;
  
  function animateGlow() {
    // 更新发光强度
    if (increasing) {
      intensity += 0.02;
      if (intensity >= 1) {
        intensity = 1;
        increasing = false;
      }
    } else {
      intensity -= 0.02;
      if (intensity <= 0.3) {
        intensity = 0.3;
        increasing = true;
      }
    }
    
    // 应用到所有配电室模型
    powerRooms.forEach(obj => {
      if (obj.material) {
        obj.material.opacity = intensity;
      }
    });
    
    // 继续动画循环
    glowAnimationId = requestAnimationFrame(animateGlow);
  }
  
  // 启动动画
  animateGlow();
  
  // 添加边缘发光效果
  addEdgeGlow(app, powerRooms);
}

/**
 * 添加边缘发光效果
 * @param {*} app 
 * @param {*} objects 
 */
function addEdgeGlow(app, objects) {
  objects.forEach(obj => {
    // 创建边缘几何体
    const edges = new THREE.EdgesGeometry(obj.geometry);
    
    // 创建边缘线材质
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });
    
    // 创建线条对象
    const line = new THREE.LineSegments(edges, lineMaterial);
    
    // 复制原始对象的变换
    line.position.copy(obj.position);
    line.rotation.copy(obj.rotation);
    line.scale.copy(obj.scale);
    
    // 将线条添加为原始对象的子对象
    obj.add(line);
    
    // 存储线条引用以便后续移除
    obj.userData.edgeLine = line;
  });
}

/**
 * 移除配电室模型的发光效果
 * @param {*} app 
 */
export function removeGlowEffectFromPowerRoom(app) {
  // 停止动画
  if (glowAnimationId) {
    cancelAnimationFrame(glowAnimationId);
    glowAnimationId = null;
  }
  
  // 恢复原始材质
  app.model.traverse((obj) => {
    if (obj.isMesh) {
      // 恢复所有模型的原始材质
      if (obj.userData.originalMaterial) {
        obj.material = obj.userData.originalMaterial;
        delete obj.userData.originalMaterial;
      }
      
      // 移除边缘线
      if (obj.userData.edgeLine) {
        obj.remove(obj.userData.edgeLine);
        delete obj.userData.edgeLine;
      }
    }
  });
  
  // 清空原始材质映射
  originalMaterials.clear();
} 