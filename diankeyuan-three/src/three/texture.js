import * as THREE from 'three';
const textureLoader = new THREE.TextureLoader();

// 线条贴图
const lineReatCount = 1;
export const secondaryTexture = textureLoader.load('texture/green_line.png');
secondaryTexture.wrapS = secondaryTexture.wrapT = THREE.RepeatWrapping;
secondaryTexture.repeat.set(lineReatCount, lineReatCount);
export const trunkTexture = textureLoader.load('texture/red_line.png');
trunkTexture.wrapS = trunkTexture.wrapT = THREE.RepeatWrapping;
trunkTexture.repeat.set(lineReatCount, lineReatCount);
export const primaryTexture = textureLoader.load('texture/blue_line.png');
primaryTexture.wrapS = primaryTexture.wrapT = THREE.RepeatWrapping;
primaryTexture.repeat.set(lineReatCount, lineReatCount);

export const skyTexture = textureLoader.load('texture/night.jpg');

// 粒子贴图
export const pointTexture = textureLoader.load('texture/TX-GY-021_p1.png');
