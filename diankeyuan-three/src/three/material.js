import * as THREE from 'three';
import { secondaryTexture, trunkTexture, primaryTexture, pointTexture } from './texture';

export const floorBaseMaterial = new THREE.MeshBasicMaterial({
  color: 0x00beff,
  transparent: true,
  opacity: 0.1,
  depthWrite: false
});

export const floorBaseMaterial2 = new THREE.MeshBasicMaterial({
  color: 0x00beff,
  transparent: true,
  opacity: 0.1,
  wireframe: true
});

export const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });

// 地图线材质
export const secondaryMaterial = new THREE.MeshBasicMaterial({
  map: secondaryTexture,
  transparent: true,
  side: THREE.DoubleSide,
  opacity: 1
});
export const trunkMaterial = new THREE.MeshBasicMaterial({
  map: trunkTexture,
  transparent: true,
  side: THREE.DoubleSide,
  opacity: 1
});

// 电线柱体专用材质
export const wireMaterial = new THREE.MeshBasicMaterial({
  map: trunkTexture,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 1
});

export const primaryMaterial = new THREE.MeshBasicMaterial({
  map: primaryTexture,
  transparent: true,
  side: THREE.DoubleSide,
  opacity: 1
});

// 点材质
export const pointMaterial = new THREE.PointsMaterial({
  size: 2,
  map: pointTexture,
  fog: true,
  blending: THREE.AdditiveBlending,
  depthTest: false,
  transparent: true, // 透明
  opacity: 1 // 透明度
});
