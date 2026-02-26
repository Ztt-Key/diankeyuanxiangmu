import * as THREE from 'three';

/**
 * 在园区主体建筑外围添加装饰元素：树木、花坛、周边小建筑、路灯
 */
export function createSceneDecorations(app) {
  const group = new THREE.Group();
  group.name = 'sceneDecorations';

  createSurroundingTrees(group);
  createFlowerBeds(group);
  createSurroundingBuildings(group);
  createStreetLamps(group);

  app.scene.add(group);
  console.log('场景外围装饰已添加');
}

// ========== 树木 ==========
function createTree(x, y, z, scale = 1) {
  const tree = new THREE.Group();

  // 树干
  const trunkGeo = new THREE.CylinderGeometry(0.15 * scale, 0.25 * scale, 2.5 * scale, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.25 * scale;
  trunk.castShadow = true;
  tree.add(trunk);

  // 树冠（多层球体叠加，更自然）
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2d5a27,
    roughness: 0.8,
    metalness: 0.05
  });

  const crownPositions = [
    { y: 3.0, r: 1.4 },
    { y: 3.8, r: 1.1 },
    { y: 4.4, r: 0.7 },
  ];

  crownPositions.forEach(p => {
    const crownGeo = new THREE.SphereGeometry(p.r * scale, 8, 6);
    const crown = new THREE.Mesh(crownGeo, leafMat);
    crown.position.y = p.y * scale;
    crown.castShadow = true;
    tree.add(crown);
  });

  tree.position.set(x, y, z);
  return tree;
}

function createPineTree(x, y, z, scale = 1) {
  const tree = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.1 * scale, 0.2 * scale, 3 * scale, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2f1a, roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.5 * scale;
  trunk.castShadow = true;
  tree.add(trunk);

  const pineMat = new THREE.MeshStandardMaterial({ color: 0x1a4a2a, roughness: 0.7 });

  // 三层锥形树冠
  const layers = [
    { y: 3.0, rBottom: 1.5, rTop: 0.1, h: 2.0 },
    { y: 4.2, rBottom: 1.1, rTop: 0.1, h: 1.6 },
    { y: 5.2, rBottom: 0.7, rTop: 0.05, h: 1.2 },
  ];

  layers.forEach(l => {
    const coneGeo = new THREE.CylinderGeometry(l.rTop * scale, l.rBottom * scale, l.h * scale, 8);
    const cone = new THREE.Mesh(coneGeo, pineMat);
    cone.position.y = l.y * scale;
    cone.castShadow = true;
    tree.add(cone);
  });

  tree.position.set(x, y, z);
  return tree;
}

function createSurroundingTrees(group) {
  const treePositions = [
    // 前方道路两侧行道树（Z > 0 方向）
    { x: -55, z: 55, s: 1.2, type: 'round' },
    { x: -40, z: 55, s: 1.0, type: 'pine' },
    { x: -25, z: 55, s: 1.3, type: 'round' },
    { x: -10, z: 55, s: 1.1, type: 'pine' },
    { x: 5, z: 55, s: 1.2, type: 'round' },
    { x: 20, z: 55, s: 1.0, type: 'pine' },
    { x: 35, z: 55, s: 1.3, type: 'round' },
    { x: 50, z: 55, s: 1.1, type: 'round' },

    // 后方（Z < 0 方向）
    { x: -55, z: -55, s: 1.1, type: 'pine' },
    { x: -35, z: -55, s: 1.3, type: 'round' },
    { x: -15, z: -58, s: 1.0, type: 'pine' },
    { x: 5, z: -55, s: 1.2, type: 'round' },
    { x: 25, z: -58, s: 1.1, type: 'pine' },
    { x: 45, z: -55, s: 1.3, type: 'round' },

    // 左侧（X < 0）
    { x: -65, z: -40, s: 1.2, type: 'pine' },
    { x: -65, z: -20, s: 1.0, type: 'round' },
    { x: -65, z: 0, s: 1.3, type: 'pine' },
    { x: -65, z: 20, s: 1.1, type: 'round' },
    { x: -65, z: 40, s: 1.2, type: 'pine' },

    // 右侧（X > 0）
    { x: 60, z: -40, s: 1.0, type: 'round' },
    { x: 60, z: -20, s: 1.3, type: 'pine' },
    { x: 60, z: 0, s: 1.1, type: 'round' },
    { x: 60, z: 20, s: 1.2, type: 'pine' },
    { x: 60, z: 40, s: 1.0, type: 'round' },

    // 外围散落的树（远处点缀）
    { x: -80, z: 70, s: 1.5, type: 'round' },
    { x: -75, z: -70, s: 1.4, type: 'pine' },
    { x: 75, z: 65, s: 1.6, type: 'round' },
    { x: 80, z: -60, s: 1.3, type: 'pine' },
    { x: -90, z: 30, s: 1.4, type: 'round' },
    { x: 85, z: 10, s: 1.5, type: 'pine' },
    { x: 0, z: 75, s: 1.3, type: 'round' },
    { x: -30, z: -75, s: 1.5, type: 'pine' },
    { x: 30, z: 70, s: 1.2, type: 'round' },
  ];

  treePositions.forEach(p => {
    const fn = p.type === 'pine' ? createPineTree : createTree;
    group.add(fn(p.x, 0, p.z, p.s));
  });
}

// ========== 花坛 ==========
function createFlowerBed(x, y, z, radiusX = 3, radiusZ = 3) {
  const bed = new THREE.Group();

  // 石质边框
  const shape = new THREE.Shape();
  const segments = 32;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    shape.lineTo(Math.cos(angle) * radiusX, Math.sin(angle) * radiusZ);
  }
  const inner = new THREE.Path();
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    inner.lineTo(Math.cos(angle) * (radiusX - 0.3), Math.sin(angle) * (radiusZ - 0.3));
  }
  shape.holes.push(inner);

  const extrudeSettings = { depth: 0.4, bevelEnabled: false };
  const borderGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const borderMat = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.7 });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.rotation.x = -Math.PI / 2;
  border.position.y = 0.2;
  bed.add(border);

  // 花丛
  const flowerColors = [0xff6b9d, 0xffb347, 0xff6b6b, 0xc39bd3, 0x7dcea0];
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * (radiusX - 0.6);
    const fx = Math.cos(angle) * r;
    const fz = Math.sin(angle) * r;
    const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
    const flowerGeo = new THREE.SphereGeometry(0.2 + Math.random() * 0.2, 6, 4);
    const flowerMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
    const flower = new THREE.Mesh(flowerGeo, flowerMat);
    flower.position.set(fx, 0.5 + Math.random() * 0.3, fz);
    bed.add(flower);
  }

  // 绿叶底层
  const grassGeo = new THREE.CylinderGeometry(radiusX - 0.3, radiusX - 0.3, 0.3, 16);
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x3a7a3a, roughness: 0.8 });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.position.y = 0.35;
  bed.add(grass);

  bed.position.set(x, y, z);
  return bed;
}

function createFlowerBeds(group) {
  const beds = [
    { x: -55, z: 48, rx: 2.5, rz: 2.5 },
    { x: 50, z: 48, rx: 3, rz: 2 },
    { x: -55, z: -48, rx: 2, rz: 2 },
    { x: 50, z: -48, rx: 2.5, rz: 2.5 },
    { x: -70, z: 0, rx: 2, rz: 3 },
    { x: 65, z: 0, rx: 2, rz: 3 },
  ];

  beds.forEach(b => {
    group.add(createFlowerBed(b.x, 0, b.z, b.rx, b.rz));
  });
}

// ========== 周边小建筑 ==========
function createBuilding(x, y, z, w, h, d, color, roofColor) {
  const building = new THREE.Group();

  // 主体
  const bodyGeo = new THREE.BoxGeometry(w, h, d);
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.6,
    metalness: 0.1
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  building.add(body);

  // 窗户
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x87ceeb,
    roughness: 0.2,
    metalness: 0.3,
    emissive: 0x1a3a5a,
    emissiveIntensity: 0.3
  });

  const floors = Math.floor(h / 3);
  const windowsPerFloor = Math.max(Math.floor(w / 2.5), 1);

  for (let floor = 0; floor < floors; floor++) {
    for (let wi = 0; wi < windowsPerFloor; wi++) {
      const winGeo = new THREE.PlaneGeometry(1, 1.2);
      // 前面
      const winF = new THREE.Mesh(winGeo, windowMat);
      winF.position.set(
        -w / 2 + 1.2 + wi * (w / windowsPerFloor),
        1.5 + floor * 3,
        d / 2 + 0.01
      );
      building.add(winF);
      // 后面
      const winB = winF.clone();
      winB.position.z = -d / 2 - 0.01;
      winB.rotation.y = Math.PI;
      building.add(winB);
    }
  }

  // 屋顶
  const roofGeo = new THREE.BoxGeometry(w + 0.5, 0.5, d + 0.5);
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.5 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = h + 0.25;
  roof.castShadow = true;
  building.add(roof);

  building.position.set(x, y, z);
  return building;
}

function createSurroundingBuildings(group) {
  const buildings = [
    // 右后方小区住宅楼群
    { x: 80, z: -50, w: 8, h: 18, d: 6, color: 0x9e9e9e, roof: 0x5a5a5a },
    { x: 95, z: -45, w: 7, h: 24, d: 5, color: 0xa8a8a8, roof: 0x4a4a4a },
    { x: 88, z: -35, w: 6, h: 15, d: 6, color: 0x8e8e8e, roof: 0x555555 },

    // 右前方商业建筑
    { x: 78, z: 40, w: 10, h: 12, d: 8, color: 0xb0c4de, roof: 0x4682b4 },
    { x: 92, z: 50, w: 7, h: 20, d: 6, color: 0xbfc9ca, roof: 0x566573 },

    // 左后方建筑
    { x: -85, z: -45, w: 9, h: 22, d: 7, color: 0xa0a0a0, roof: 0x505050 },
    { x: -95, z: -30, w: 6, h: 14, d: 5, color: 0xaaaaaa, roof: 0x5a5a5a },

    // 左前方建筑
    { x: -82, z: 45, w: 8, h: 16, d: 6, color: 0xb5b5b5, roof: 0x484848 },
    { x: -95, z: 55, w: 7, h: 10, d: 7, color: 0xc0c0c0, roof: 0x606060 },

    // 远处高层建筑（天际线）
    { x: 110, z: 0, w: 8, h: 35, d: 8, color: 0x778899, roof: 0x2f4f4f },
    { x: -110, z: 10, w: 7, h: 30, d: 7, color: 0x708090, roof: 0x2f4f4f },
    { x: 0, z: -85, w: 10, h: 28, d: 8, color: 0x808080, roof: 0x3a3a3a },
    { x: -40, z: 80, w: 8, h: 25, d: 6, color: 0x7a8a9a, roof: 0x3a4a5a },
    { x: 50, z: -80, w: 7, h: 32, d: 7, color: 0x6a7a8a, roof: 0x2a3a4a },
  ];

  buildings.forEach(b => {
    group.add(createBuilding(b.x, 0, b.z, b.w, b.h, b.d, b.color, b.roof));
  });
}

// ========== 路灯 ==========
function createStreetLamp(x, y, z) {
  const lamp = new THREE.Group();

  // 灯杆
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.6, roughness: 0.3 });
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 5, 8);
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 2.5;
  pole.castShadow = true;
  lamp.add(pole);

  // 灯臂
  const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6);
  const arm = new THREE.Mesh(armGeo, poleMat);
  arm.position.set(0.6, 4.8, 0);
  arm.rotation.z = -Math.PI / 3;
  lamp.add(arm);

  // 灯头
  const headGeo = new THREE.CylinderGeometry(0.4, 0.15, 0.25, 8);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xffee88,
    emissive: 0xffdd44,
    emissiveIntensity: 0.8,
    roughness: 0.3
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(1.0, 5.2, 0);
  lamp.add(head);

  // 灯底座
  const baseGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.2, 8);
  const base = new THREE.Mesh(baseGeo, poleMat);
  base.position.y = 0.1;
  lamp.add(base);

  lamp.position.set(x, y, z);
  return lamp;
}

function createStreetLamps(group) {
  const lampPositions = [
    // 前方道路
    { x: -48, z: 52 }, { x: -28, z: 52 }, { x: -8, z: 52 },
    { x: 12, z: 52 }, { x: 32, z: 52 }, { x: 52, z: 52 },
    // 后方道路
    { x: -48, z: -52 }, { x: -20, z: -52 },
    { x: 10, z: -52 }, { x: 40, z: -52 },
    // 左右两侧
    { x: -62, z: -30 }, { x: -62, z: 0 }, { x: -62, z: 30 },
    { x: 58, z: -30 }, { x: 58, z: 0 }, { x: 58, z: 30 },
  ];

  lampPositions.forEach(p => {
    group.add(createStreetLamp(p.x, 0, p.z));
  });
}
