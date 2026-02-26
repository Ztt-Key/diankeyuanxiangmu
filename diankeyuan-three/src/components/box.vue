<template>
    <div class="box" v-if="visible" @click.stop="handleContainerClick">
        <div class="box-header">
            <h2>{{ currentConfig && currentConfig.id ? currentConfig.id : '操作面板' }}</h2>
        </div>
        <div class="box-background"></div>
        <div class="box-content">
            <div v-for="(equipment, index) in currentConfig.equipmentList" :key="equipment.id" class="video-container" :class="{'error': loadingStatus.errors[index]}">
                <div class="cabinet-header">
                    <div class="power-badge">
                        功率值：{{ getMockPowerLevel(equipment, index) }} kW
                    </div>
                    <h3>{{ equipment.title }}</h3>
                </div>
                <!-- 开关状态UI暂时隐藏，仅在内部逻辑中使用设备状态，不在界面展示 -->

                <div v-if="loadingStatus.errors[index]" class="error-message">
                    <span>加载失败</span>
                    <button @click="reloadVideo(index)">重试</button>
                </div>
                <video v-if="equipment.video && !equipment.video.includes('boxB') && !equipment.video.includes('boxC') && !equipment.video.includes('boxD')" :ref="`boxVideo${index}`"
                    class="box-video" @ended="videoEnded(index)" @canplay="videoCanPlay(index)" 
                    @error="videoError(index, $event)" preload="auto" muted
                    @click.stop="playVideo(index)">
                    <source :src="getMediaUrl(equipment.video, 'video', index)" type="video/mp4">
                </video>
                <video v-if="equipment.video && equipment.video.includes('boxB')" :ref="`boxVideo${index}`"
                    class="box-video box-video-b" @ended="videoEnded(index)" @canplay="videoCanPlay(index)"
                    @error="videoError(index, $event)" preload="auto" muted 
                    @click.stop="playVideo(index)">
                    <source :src="getMediaUrl(equipment.video, 'video', index)" type="video/mp4">
                </video>
                <video v-if="equipment.video && equipment.video.includes('boxC')" :ref="`boxVideo${index}`"
                    class="box-video box-video-c" @ended="videoEnded(index)" @canplay="videoCanPlay(index)"
                    @error="videoError(index, $event)" preload="auto" muted
                    @click.stop="playVideo(index)">
                    <source :src="getMediaUrl(equipment.video, 'video', index)" type="video/mp4">
                </video>
                <video v-if="equipment.video && equipment.video.includes('boxD')" :ref="`boxVideo${index}`"
                    class="box-video box-video-d" @ended="videoEnded(index)" @canplay="videoCanPlay(index)"
                    @error="videoError(index, $event)" preload="auto" muted
                    @click.stop="playVideo(index)">
                    <source :src="getMediaUrl(equipment.video, 'video', index)" type="video/mp4">
                </video>
                <img v-if="equipment.img" :src="getMediaUrl(equipment.img, 'image', index)" class="box-image" alt="equipment image">
            </div>
        </div>
    </div>
</template>

<script>
import EventBus from '@/bus';

export default {
    name: 'box',
    components: {},
    props: {},
    data() {
        return {
            visible: false,
            currentConfig: null,
            videos: [],
            reversePlayIntervals: [],
            lastFrameTime: 0,
            frameInterval: 1000 / 30, // 30fps

            // 修改媒体资源缓存结构，添加设备ID前缀
            mediaCache: {
                videos: {},
                images: {}
            },

            // 新增：设备ID映射表
            equipmentIdMap: {},
            // 新增：当前正在显示的设备ID
            currentEquipmentIds: [],
            // 新增：当前设备的开关状态映射表（true: 合闸，false: 分闸）
            equipmentStatusMap: {},

            // 新增：存储视频元素引用
            videoElements: {},
            // 新增：加载状态跟踪
            loadingStatus: {
                retryCount: {},
                errors: {}
            },
            // 培训模式相关
            isTrainingMode: false,
            highlightedEquipments: [],
            trainingErrors: [],

            // 新增：模拟电量缓存，避免每次渲染都变动
            powerLevelMap: {}
        };
    },
    methods: {
        handleOutsideClick() {
            // 点击外部区域时隐藏面板
            if (this.visible) {
                this.visible = false;
                EventBus.$emit('showBox', { show: false });
                document.removeEventListener('click', this.handleOutsideClick);
            }
        },
        handleContainerClick(event) {
            event.stopPropagation();
        },
        playVideo(index, event) {
            if (event) {
                event.stopPropagation();
            }

            const video = this.$refs[`boxVideo${index}`][0];
            if (!video) return;

            // 如果视频已经播放完成（在最后一帧）或处于第一帧
            if (video.currentTime === 0 || video.currentTime === video.duration) {
                // 设备当前状态
                const isConnected = video.currentTime === 0;
                
                if (isConnected) {
                    // 如果当前是连接状态（第一帧），点击后播放视频（模拟断开过程）
                    this.attemptPlay(index);
                    
                    // 设备断开连接
                    if (window.app && window.app.powerRoomInteractionEnabled) {
                        const equipment = this.currentConfig.equipmentList[index];
                        if (equipment && equipment.id) {
                            EventBus.$emit('updateCircuitConnection', {
                                deviceId: equipment.id,
                                status: false
                            });
                            
                            // 新增：同步高亮线路图中对应节点
                            EventBus.$emit('highlightCircuitNode', {
                                deviceId: equipment.id,
                                title: equipment.title,
                                status: false
                            });

                            // 同步3D柜子按钮状态（断开）
                            EventBus.$emit('cabinetDeviceStateChange', {
                                cabinetId: this.currentConfig && this.currentConfig.id,
                                deviceId: equipment.id,
                                equipmentIndex: index,
                                equipmentTotal: this.currentConfig.equipmentList.length,
                                title: equipment.title,
                                status: false
                            });
                        }
                    }
                } else {
                    // 如果当前是断开状态（最后一帧），开始倒放（模拟重新连接过程）
                    this.startReversePlay(index);
                    
                    // 设备连接
                    if (window.app && window.app.powerRoomInteractionEnabled) {
                        const equipment = this.currentConfig.equipmentList[index];
                        if (equipment && equipment.id) {
                            EventBus.$emit('updateCircuitConnection', {
                                deviceId: equipment.id,
                                status: true
                            });
                            
                            // 新增：同步高亮线路图中对应节点
                            EventBus.$emit('highlightCircuitNode', {
                                deviceId: equipment.id,
                                title: equipment.title,
                                status: true
                            });

                            // 同步3D柜子按钮状态（接通）
                            EventBus.$emit('cabinetDeviceStateChange', {
                                cabinetId: this.currentConfig && this.currentConfig.id,
                                deviceId: equipment.id,
                                equipmentIndex: index,
                                equipmentTotal: this.currentConfig.equipmentList.length,
                                title: equipment.title,
                                status: true
                            });
                        }
                    }
                }
                return;
            }

            // 如果正在播放或倒放过程中
            if (this.videos[index].isPlaying || this.reversePlayIntervals[index]) {
                // 暂停播放
                video.pause();
                this.videos[index].isPlaying = false;
                
                // 如果正在倒放，停止倒放
                if (this.reversePlayIntervals[index]) {
                    this.stopReversePlay(index);
                }
                return;
            }
        },
        videoCanPlay(index) {
            if (!this.videos[index]) return;
            
            this.videos[index].videoReady = true;
            // 清除错误状态
            this.loadingStatus.errors[index] = false;
            
            // 获取设备信息用于调试
            if (this.currentConfig && this.currentConfig.equipmentList && this.currentConfig.equipmentList[index]) {
                const equipment = this.currentConfig.equipmentList[index];
                console.log(`设备视频就绪: ${equipment.id} - ${equipment.title}`);
                
                // 检查是否有挂起的状态需要应用
                if (equipment.pendingStatus !== undefined) {
                    console.log(`应用挂起的状态: ${equipment.pendingStatus ? '接通' : '断开'}`);
                    const video = this.$refs[`boxVideo${index}`][0];
                    
                    if (!equipment.pendingStatus) {
                        // 设备断开，显示视频最后一帧
                        video.currentTime = video.duration || 0;
                        video.pause();
                    } else {
                        // 设备接通，显示第一帧
                        video.currentTime = 0;
                        video.pause();
                    }
                    
                    // 清除挂起状态
                    delete equipment.pendingStatus;
                }
            }
        },
        attemptPlay(index) {
            const video = this.$refs[`boxVideo${index}`][0];
            if (video) {
                try {
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                                if (!this.videos[index]) {
                                    this.$set(this.videos, index, {
                                        isPlaying: true,
                                        videoReady: false
                                    });
                                } else {
                                    this.videos[index].isPlaying = true;
                                }
                                console.log(`视频 ${index} 开始播放`);
                            })
                            .catch(err => {
                                console.error('播放视频时出错:', err);
                                if (this.videos[index]) {
                                    this.videos[index].isPlaying = false;
                                }
                            });
                    }
                } catch (e) {
                    console.error('尝试播放视频时出错:', e);
                    if (this.videos[index]) {
                        this.videos[index].isPlaying = false;
                    }
                }
            }
        },
        videoEnded(index) {
            if (this.videos[index]) {
                this.videos[index].isPlaying = false;
                console.log(`视频 ${index} 播放结束`);
            }
        },
        startReversePlay(index) {
            const video = this.$refs[`boxVideo${index}`][0];
            if (!video) return;

            // 清除可能存在的旧定时器
            this.stopReversePlay(index);

            // 使用 requestAnimationFrame 实现倒放
            const animate = (currentTime) => {
                if (!this.lastFrameTime) {
                    this.lastFrameTime = currentTime;
                    this.reversePlayIntervals[index] = requestAnimationFrame(animate);
                    return;
                }

                const deltaTime = currentTime - this.lastFrameTime;
                if (deltaTime >= this.frameInterval) {
                    if (video.currentTime > 0) {
                        video.currentTime = Math.max(0, video.currentTime - (deltaTime / 1000));
                        this.lastFrameTime = currentTime;
                    } else {
                        this.stopReversePlay(index);
                        return;
                    }
                }

                this.reversePlayIntervals[index] = requestAnimationFrame(animate);
            };

            this.lastFrameTime = 0;
            this.reversePlayIntervals[index] = requestAnimationFrame(animate);
        },
        stopReversePlay(index) {
            if (this.reversePlayIntervals[index]) {
                cancelAnimationFrame(this.reversePlayIntervals[index]);
                this.reversePlayIntervals[index] = null;
            }
            this.lastFrameTime = 0;
        },
        reset() {
            console.log('重置所有视频状态...');
            // 清空当前显示的设备ID
            this.currentEquipmentIds = [];
            
            // 重置加载状态
            this.loadingStatus = {
                retryCount: {},
                errors: {}
            };
            
            // 重置所有视频
            this.videos.forEach((video, index) => {
                video.isPlaying = false;
                
                // 注意：不重置videoReady状态，避免闪烁
                // video.videoReady = false;

                // 停止倒放
                this.stopReversePlay(index);

                // 仅暂停和重置视频到第一帧，不清空源
                this.$nextTick(() => {
                    if (this.$refs[`boxVideo${index}`] && this.$refs[`boxVideo${index}`][0]) {
                        const videoElement = this.$refs[`boxVideo${index}`][0];
                        videoElement.currentTime = 0;
                        videoElement.pause();
                        
                        // 暂存视频元素引用
                        this.videoElements[index] = videoElement;
                    }
                });
            });
        },
        // 修改预加载媒体资源方法，确保资源预加载成功
        preloadMediaResources(config) {
            if (!config || !config.equipmentList) return;
            
            // 存储当前显示的设备ID
            this.currentEquipmentIds = config.equipmentList.map(eq => eq.id);

            // 新增：根据设备数量初始化视频状态数组，避免 this.videos[index] 为 undefined
            this.videos = config.equipmentList.map(() => ({
                isPlaying: false,
                videoReady: false
            }));
            
            console.log('开始预加载媒体资源...');

            // 使用Promise.all并行加载所有资源
            const preloadPromises = [];

            config.equipmentList.forEach((equipment, index) => {
                // 预加载视频
                if (equipment.video) {
                    console.log('预加载视频:', equipment.video, '设备ID:', equipment.id);
                    
                    // 创建视频预加载Promise
                    const videoPromise = this.fetchAndCacheResource(equipment.video, 'video', equipment.id)
                        .then(blobUrl => {
                            console.log(`视频预加载完成: ${equipment.video}`);
                            return blobUrl;
                        })
                        .catch(err => {
                            console.error(`视频预加载失败: ${equipment.video}`, err);
                            return null;
                        });
                        
                    preloadPromises.push(videoPromise);
                }

                // 预加载图片
                if (equipment.img) {
                    console.log('预加载图片:', equipment.img, '设备ID:', equipment.id);
                    
                    // 创建图片预加载Promise
                    const imgPromise = this.fetchAndCacheResource(equipment.img, 'image', equipment.id)
                        .then(blobUrl => {
                            console.log(`图片预加载完成: ${equipment.img}`);
                            return blobUrl;
                        })
                        .catch(err => {
                            console.error(`图片预加载失败: ${equipment.img}`, err);
                            return null;
                        });
                        
                    preloadPromises.push(imgPromise);
                }
            });

            // 等待所有资源加载完成
            Promise.all(preloadPromises)
                .then(() => {
                    console.log('所有媒体资源预加载完成');
                    // 更新所有视频元素
                    this.$nextTick(() => {
                        config.equipmentList.forEach((equipment, index) => {
                            if (equipment.video && this.$refs[`boxVideo${index}`] && this.$refs[`boxVideo${index}`][0]) {
                                // 在DOM更新后，尝试更新视频源
                                const video = this.$refs[`boxVideo${index}`][0];
                                const source = video.querySelector('source');
                                if (source) {
                                    const uniqueKey = `${equipment.id}:${equipment.video}`;
                                    const cachedUrl = this.mediaCache.videos[uniqueKey] || this.mediaCache.videos[equipment.video];
                                    if (cachedUrl) {
                                        source.setAttribute('src', cachedUrl);
                                        video.load();
                                        
                                        // 检查是否存在挂起的状态需要应用
                                        if (equipment.pendingStatus !== undefined) {
                                            console.log(`视频加载后应用挂起的状态: ${equipment.pendingStatus ? '接通' : '断开'}`);
                                            
                                            // 等待元数据加载完成
                                            video.addEventListener('loadedmetadata', () => {
                                                if (!equipment.pendingStatus) {
                                                    // 设备断开，显示视频最后一帧
                                                    video.currentTime = video.duration || 0;
                                                    video.pause();
                                                } else {
                                                    // 设备接通，显示第一帧
                                                    video.currentTime = 0;
                                                    video.pause();
                                                }
                                            }, { once: true });
                                        }
                                    }
                                }
                            }
                        });
                    });
                })
                .catch(err => {
                    console.error('媒体资源预加载过程中出错:', err);
                });
        },
        // 修改获取并缓存资源方法，添加设备ID参数，并优化缓存逻辑
        async fetchAndCacheResource(url, type, deviceId = '') {
            try {
                const uniqueKey = `${deviceId}:${url}`;
                
                // 检查缓存中是否已存在该资源
                if (type === 'video' && this.mediaCache.videos[uniqueKey]) {
                    return this.mediaCache.videos[uniqueKey];
                } else if (type === 'image' && this.mediaCache.images[uniqueKey]) {
                    return this.mediaCache.images[uniqueKey];
                }
                
                // 兼容旧版缓存
                if (type === 'video' && this.mediaCache.videos[url]) {
                    // 复制旧缓存到新格式
                    this.mediaCache.videos[uniqueKey] = this.mediaCache.videos[url];
                    return this.mediaCache.videos[url];
                } else if (type === 'image' && this.mediaCache.images[url]) {
                    this.mediaCache.images[uniqueKey] = this.mediaCache.images[url];
                    return this.mediaCache.images[url];
                }

                // 如果缓存中不存在，则获取资源
                console.log(`获取${type}资源: ${url} 设备ID: ${deviceId}`);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch ${type}: ${url}`);

                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);

                // 同时存入新旧两种格式的缓存，确保兼容性
                if (type === 'video') {
                    this.mediaCache.videos[uniqueKey] = objectUrl;
                    this.mediaCache.videos[url] = objectUrl; // 兼容旧格式
                } else {
                    this.mediaCache.images[uniqueKey] = objectUrl;
                    this.mediaCache.images[url] = objectUrl; // 兼容旧格式
                }

                return objectUrl;
            } catch (error) {
                console.error(`获取${type}资源失败:`, url, error);
                return url; // 失败时返回原始URL
            }
        },
        // 修改获取媒体资源URL方法，使用设备ID创建唯一键
        getMediaUrl(url, type, index) {
            if (!url) return '';
            
            // 获取当前设备ID
            let deviceId = '';
            if (this.currentConfig && 
                this.currentConfig.equipmentList && 
                this.currentConfig.equipmentList[index]) {
                deviceId = this.currentConfig.equipmentList[index].id;
            }
            
            // 修复：先尝试直接使用URL作为键，兼容旧版缓存
            if (type === 'video' && this.mediaCache.videos[url]) {
                console.log(`从旧版缓存获取视频: ${url}`);
                return this.mediaCache.videos[url];
            } else if (type === 'image' && this.mediaCache.images[url]) {
                console.log(`从旧版缓存获取图片: ${url}`);
                return this.mediaCache.images[url];
            }
            
            // 然后尝试使用带设备ID的唯一键
            const uniqueKey = `${deviceId}:${url}`;
            
            if (type === 'video' && this.mediaCache.videos[uniqueKey]) {
                console.log(`从缓存获取视频: ${url} 设备ID: ${deviceId}`);
                return this.mediaCache.videos[uniqueKey];
            } else if (type === 'image' && this.mediaCache.images[uniqueKey]) {
                return this.mediaCache.images[uniqueKey];
            }
            
            // 如果缓存中没有，则立即开始缓存
            console.log(`未找到缓存，直接使用原始URL: ${url}`);
            // 异步获取资源但不阻塞渲染
            this.$nextTick(() => {
                this.fetchAndCacheResource(url, type, deviceId).then(cachedUrl => {
                    console.log(`资源加载完成: ${url}, 缓存URL: ${cachedUrl}`);
                    // 手动更新相应元素的src
                    this.$nextTick(() => {
                        if (this.$refs[`boxVideo${index}`] && this.$refs[`boxVideo${index}`][0]) {
                            const element = this.$refs[`boxVideo${index}`][0];
                            const source = element.querySelector('source');
                            if (source && source.getAttribute('src') === url) {
                                source.setAttribute('src', cachedUrl);
                                element.load();
                                console.log(`已更新视频 ${index} 的源`);
                            }
                        }
                    });
                }).catch(err => {
                    console.error(`资源加载失败: ${url}`, err);
                });
            });
            
            // 直接返回原始URL，让浏览器先加载
            return url;
        },
        // 新增：获取模拟电量（百分比），对同一设备保持稳定
        getMockPowerLevel(equipment, index) {
            if (!equipment) return 0;

            const key = equipment.id || `${this.currentConfig && this.currentConfig.id || 'unknown'}-${index}`;

            if (this.powerLevelMap[key] !== undefined) {
                return this.powerLevelMap[key];
            }

            // 基于 key 生成一个稳定的伪随机数 60-100
            let hash = 0;
            for (let i = 0; i < key.length; i++) {
                hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
            }
            const level = 60 + (hash % 41); // 60-100
            this.powerLevelMap[key] = level;
            return level;
        },
        // 新增：生成设备ID映射表
        generateEquipmentIdMap(config) {
            if (!config || !config.equipmentList) return;
            
            console.log('生成操作面板设备ID映射表:');
            this.equipmentIdMap = {};
            
            config.equipmentList.forEach(equipment => {
                this.equipmentIdMap[equipment.id] = {
                    title: equipment.title,
                    video: equipment.video
                };
                
                console.log(`操作面板设备: ${equipment.id} - ${equipment.title}`);
            });
            
            console.log('操作面板设备ID映射表完成，总计设备数:', Object.keys(this.equipmentIdMap).length);
        },
        // 修改清理当前视频状态方法，保留缓存
        cleanupCurrentVideoState() {
            // 停止所有视频播放
            if (this.videos && this.videos.length > 0) {
                this.videos.forEach((videoState, index) => {
                    // 停止倒放
                    this.stopReversePlay(index);
                    
                    // 暂停视频播放
                    if (this.$refs[`boxVideo${index}`] && this.$refs[`boxVideo${index}`][0]) {
                        const video = this.$refs[`boxVideo${index}`][0];
                        video.pause();
                    }
                });
            }
            
            console.log('已暂停所有视频播放');
        },
        // 新增：视频错误处理方法
        videoError(index, event) {
            // 仅当视频真正加载失败时显示错误（避免过早触发错误）
            if (event && event.target && event.target.error) {
                console.error(`视频 ${index} 加载失败:`, event.target.error);
                this.loadingStatus.errors[index] = true;
                
                // 重置视频就绪状态
                if (this.videos[index]) {
                    this.videos[index].videoReady = false;
                }
                
                // 获取设备信息用于日志
                let deviceInfo = '';
                if (this.currentConfig && this.currentConfig.equipmentList && this.currentConfig.equipmentList[index]) {
                    const equipment = this.currentConfig.equipmentList[index];
                    deviceInfo = `(ID:${equipment.id}, 标题:${equipment.title}, 视频:${equipment.video})`;
                    console.error(`设备${deviceInfo}视频加载失败`);
                }
                
                // 记录重试次数
                if (!this.loadingStatus.retryCount[index]) {
                    this.loadingStatus.retryCount[index] = 0;
                }
                
                // 仅在第一次错误时自动重试一次
                if (this.loadingStatus.retryCount[index] === 0) {
                    console.log(`自动尝试重新加载视频...`);
                    setTimeout(() => {
                        this.reloadVideo(index);
                    }, 1000); // 延迟1秒后重试
                }
            }
        },
        // 新增：重新加载视频方法
        reloadVideo(index) {
            // 获取当前设备
            if (!this.currentConfig || !this.currentConfig.equipmentList || !this.currentConfig.equipmentList[index]) {
                console.error('无法重载视频：设备信息不存在');
                return;
            }
            
            const equipment = this.currentConfig.equipmentList[index];
            console.log(`尝试重新加载视频: ${equipment.id} - ${equipment.title}`);
            
            // 增加重试计数
            if (!this.loadingStatus.retryCount[index]) {
                this.loadingStatus.retryCount[index] = 0;
            }
            this.loadingStatus.retryCount[index]++;
            
            // 重置错误状态
            this.loadingStatus.errors[index] = false;
            
            // 重置视频就绪状态
            if (this.videos[index]) {
                this.videos[index].videoReady = false;
            }
            
            // 尝试删除缓存并重新获取
            const uniqueVideoKey = `${equipment.id}:${equipment.video}`;
            if (this.mediaCache.videos[uniqueVideoKey] && this.mediaCache.videos[uniqueVideoKey].startsWith('blob:')) {
                try {
                    URL.revokeObjectURL(this.mediaCache.videos[uniqueVideoKey]);
                    delete this.mediaCache.videos[uniqueVideoKey];
                } catch (e) {
                    console.error('释放视频Blob URL失败:', e);
                }
            }
            
            // 同时删除旧格式缓存
            if (this.mediaCache.videos[equipment.video]) {
                try {
                    URL.revokeObjectURL(this.mediaCache.videos[equipment.video]);
                    delete this.mediaCache.videos[equipment.video];
                } catch (e) {
                    console.error('释放旧格式视频Blob URL失败:', e);
                }
            }
            
            // 重置视频元素
            this.$nextTick(() => {
                if (this.$refs[`boxVideo${index}`] && this.$refs[`boxVideo${index}`][0]) {
                    const video = this.$refs[`boxVideo${index}`][0];
                    
                    // 清空视频源
                    const source = video.querySelector('source');
                    if (source) {
                        source.removeAttribute('src');
                        video.load();
                    }
                    
                    // 延迟设置新的视频源，给浏览器一些时间清理旧资源
                    setTimeout(() => {
                        // 直接使用原始URL，让浏览器重新加载
                        if (source) {
                            source.setAttribute('src', equipment.video);
                            video.load();
                            
                            // 同时异步获取缓存版本
                            this.fetchAndCacheResource(equipment.video, 'video', equipment.id)
                                .then(blobUrl => {
                                    console.log(`视频重新加载完成，更新为Blob URL: ${blobUrl}`);
                                    setTimeout(() => {
                                        source.setAttribute('src', blobUrl);
                                        video.load();
                                    }, 500);
                                })
                                .catch(err => {
                                    console.error('重新获取视频资源失败:', err);
                                });
                        }
                    }, 500);
                }
            });
            
            // 强制更新组件
            this.$forceUpdate();
        },
        // 新增：从电路图获取设备状态并应用到视频
        syncWithCircuitStatus() {
            console.log('正在同步电路图状态...');
            
            if (!this.currentConfig || !this.currentConfig.equipmentList) {
                console.warn('无法同步状态：Box配置为空');
                return;
            }
            
            // 发送请求获取电路图中所有设备状态
            EventBus.$emit('requestCircuitStatus', {
                callback: (deviceStatusMap) => {
                    console.log('接收到电路图设备状态:', deviceStatusMap);
                    
                    // 确保返回的状态不为空
                    if (!deviceStatusMap) {
                        console.warn('接收到的电路图状态为空');
                        return;
                    }
                    
                    // 应用设备状态到视频
                    this.currentConfig.equipmentList.forEach((equipment, index) => {
                        // 尝试通过ID查找设备状态
                        let deviceStatus = null;
                        let deviceInfo = null;
                        
                        // 检查是否为对象格式（包含status属性）
                        if (deviceStatusMap[equipment.id]) {
                            if (typeof deviceStatusMap[equipment.id] === 'object') {
                                deviceInfo = deviceStatusMap[equipment.id];
                                deviceStatus = deviceInfo.status;
                            } else {
                                deviceStatus = deviceStatusMap[equipment.id];
                            }
                        }
                        
                        // 如果没找到，尝试模糊匹配
                        if (deviceStatus === undefined || deviceStatus === null) {
                            // 寻找ID包含关系
                            const matchingId = Object.keys(deviceStatusMap).find(id => 
                                id.includes(equipment.id) || equipment.id.includes(id)
                            );
                            
                            if (matchingId) {
                                if (typeof deviceStatusMap[matchingId] === 'object') {
                                    deviceInfo = deviceStatusMap[matchingId];
                                    deviceStatus = deviceInfo.status;
                                } else {
                                    deviceStatus = deviceStatusMap[matchingId];
                                }
                                console.log(`通过模糊匹配ID找到设备 ${equipment.id} -> ${matchingId}, 状态: ${deviceStatus}`);
                            }
                        }
                        
                        // 通过标题寻找
                        if ((deviceStatus === undefined || deviceStatus === null) && equipment.title) {
                            const matchingKeys = Object.keys(deviceStatusMap).filter(key => {
                                // 检查设备标题是否匹配
                                if (typeof deviceStatusMap[key] === 'object' && deviceStatusMap[key].title) {
                                    return deviceStatusMap[key].title.includes(equipment.title) || 
                                           equipment.title.includes(deviceStatusMap[key].title);
                                }
                                return false;
                            });
                            
                            if (matchingKeys.length > 0) {
                                // 使用第一个匹配项
                                const matchingKey = matchingKeys[0];
                                deviceInfo = deviceStatusMap[matchingKey];
                                deviceStatus = deviceInfo.status;
                                console.log(`通过标题找到设备 ${equipment.title}, 状态: ${deviceStatus}`);
                            }
                        }
                        
                        // 如果找到了设备状态
                        if (deviceStatus !== undefined && deviceStatus !== null) {
                            console.log(`应用设备 ${equipment.id} - ${equipment.title} 的状态: ${deviceStatus ? '接通' : '断开'}`);
                            
                            // 同步到状态映射表，用于界面展示
                            this.$set(this.equipmentStatusMap, equipment.id, !!deviceStatus);

                            // 存储设备状态，无论视频是否已加载
                            equipment.pendingStatus = deviceStatus;
                            
                            // 检查视频是否已加载
                            if (this.$refs[`boxVideo${index}`] && this.$refs[`boxVideo${index}`][0]) {
                                const video = this.$refs[`boxVideo${index}`][0];
                                
                                // 检查视频是否已经加载元数据
                                if (video.readyState >= 1) {
                                    // 根据设备状态设置视频
                                    if (!deviceStatus) {
                                        // 设备断开，视频播放到结束状态（最后一帧）
                                        if (video.readyState >= 2) { // HAVE_CURRENT_DATA
                                            video.currentTime = video.duration || 0;
                                        } else {
                                            // 如果视频元数据尚未加载，设置一个较大的时间值
                                            video.currentTime = 9999; // 大值会使视频跳到最后一帧
                                        }
                                        video.pause();
                                    } else {
                                        // 设备接通，显示视频第一帧
                                        video.currentTime = 0;
                                        video.pause(); // 只显示第一帧，不播放
                                    }
                                } else {
                                    console.log(`设备 ${equipment.id} 视频尚未加载，状态将在加载完成后应用`);
                                    // pendingStatus已设置，将在videoCanPlay中应用
                                }
                            } else {
                                console.log(`设备 ${equipment.id} 视频元素不存在，状态将在元素创建后应用`);
                            }
                        } else {
                            console.log(`未找到设备 ${equipment.id} - ${equipment.title} 的状态，使用默认状态`);
                        }
                    });
                }
            });
        },
        // 培训模式：高亮设备
        updateHighlightedEquipments(equipmentIds) {
            console.log('Box组件更新高亮设备:', equipmentIds);
            this.highlightedEquipments = equipmentIds || [];
            
            // 添加高亮样式
            this.$nextTick(() => {
                // 移除所有之前的高亮
                const containers = document.querySelectorAll('.video-container');
                containers.forEach(container => {
                    container.classList.remove('highlighted');
                    container.classList.remove('training-error');
                });
                
                // 添加新的高亮
                this.highlightedEquipments.forEach(equipmentId => {
                    // 查找对应的设备索引
                    const index = this.findEquipmentIndexById(equipmentId);
                    if (index !== -1) {
                        const container = document.querySelector(`.video-container:nth-child(${index + 1})`);
                        if (container) {
                            container.classList.add('highlighted');
                            // 自动滚动到高亮设备
                            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                });
                
                // 添加闪烁动画
                if (this.highlightedEquipments.length > 0) {
                    // 使用渲染任务实现闪烁效果
                    let isHighlighted = true;
                    this.$EventBus.$emit('addRenderTask', 'boxHighlight', () => {
                        const highlightedElements = document.querySelectorAll('.video-container.highlighted');
                        highlightedElements.forEach(el => {
                            // 只改变边框样式，不改变透明度
                            if (isHighlighted) {
                                el.style.boxShadow = '0 0 15px 3px rgba(255, 204, 0, 0.9)';
                                el.style.borderColor = 'rgba(255, 204, 0, 1)';
                            } else {
                                el.style.boxShadow = '0 0 5px 1px rgba(255, 204, 0, 0.5)';
                                el.style.borderColor = 'rgba(255, 204, 0, 0.5)';
                            }
                        });
                        isHighlighted = !isHighlighted;
                    });
                } else {
                    // 移除渲染任务
                    this.$EventBus.$emit('removeRenderTask', 'boxHighlight');
                }
            });
        },
        
        // 查找设备索引
        findEquipmentIndexById(equipmentId) {
            if (!this.currentConfig || !this.currentConfig.equipmentList) {
                return -1;
            }
            
            // 增强设备ID匹配逻辑
            // 1. 精确匹配ID
            let index = this.currentConfig.equipmentList.findIndex(equipment => 
                equipment.id === equipmentId
            );
            
            // 2. 如果没找到，尝试匹配标题
            if (index === -1) {
                index = this.currentConfig.equipmentList.findIndex(equipment => 
                    equipment.title && equipment.title.includes(equipmentId)
                );
            }
            
            // 3. 如果还没找到，尝试特殊匹配电容柜
            if (index === -1) {
                // 检查是否是电容柜相关ID
                const isCapacitorBank = equipmentId.includes('AL2-') || 
                                       equipmentId.includes('AL3-') || 
                                       equipmentId === '15AL2' || 
                                       equipmentId === '15AL3';
                
                if (isCapacitorBank) {
                    // 尝试匹配电容柜
                    index = this.currentConfig.equipmentList.findIndex(equipment => 
                        equipment.title && equipment.title.includes('电容柜')
                    );
                    
                    if (index !== -1) {
                        console.log(`通过特殊匹配找到电容柜设备: ${equipmentId} -> ${this.currentConfig.equipmentList[index].title}`);
                    }
                }
            }
            
            // 4. 如果还没找到，尝试特殊匹配主电源
            if (index === -1) {
                // 检查是否是主电源相关ID
                const isMainPower = equipmentId.includes('15AL1') || 
                                   equipmentId.includes('16AL1') || 
                                   equipmentId === 'main-power-b' || 
                                   equipmentId === 'main-power-d' || 
                                   equipmentId === 'main-power-16AL1';
                
                if (isMainPower) {
                    // 尝试匹配主电源设备
                    index = this.currentConfig.equipmentList.findIndex(equipment => 
                        (equipment.title && 
                         (equipment.title.includes('15AL1') || 
                          equipment.title.includes('16AL1') || 
                          equipment.title.includes('主电源'))) ||
                        (equipment.type === 'main-power')
                    );
                    
                    if (index !== -1) {
                        console.log(`通过特殊匹配找到主电源设备: ${equipmentId} -> ${this.currentConfig.equipmentList[index].title}`);
                    } else {
                        console.warn(`未找到主电源设备: ${equipmentId}，查找相似项`);
                        // 最后尝试找到任何可能是主电源的设备
                        index = this.currentConfig.equipmentList.findIndex(equipment => 
                            equipment.title && equipment.title.toLowerCase().includes('al1')
                        );
                        
                        if (index !== -1) {
                            console.log(`找到可能的主电源替代设备: ${this.currentConfig.equipmentList[index].id} -> ${this.currentConfig.equipmentList[index].title}`);
                        }
                    }
                }
            }
            
            // 5. 记录查找结果
            if (index === -1) {
                console.warn(`未找到设备: ${equipmentId}`);
            } else {
                console.log(`找到设备: ${equipmentId} -> ${this.currentConfig.equipmentList[index].id}, ${this.currentConfig.equipmentList[index].title}`);
            }
            
            return index;
        },
        
        // 培训模式：显示错误
        showTrainingError(equipmentId) {
            console.log('Box组件显示培训错误:', equipmentId);
            
            // 添加到错误设备列表
            if (equipmentId && !this.trainingErrors.includes(equipmentId)) {
                this.trainingErrors.push(equipmentId);
            }
            
            // 添加错误样式
            this.$nextTick(() => {
                this.trainingErrors.forEach(id => {
                    const index = this.findEquipmentIndexById(id);
                    if (index !== -1) {
                        const container = document.querySelector(`.video-container:nth-child(${index + 1})`);
                        if (container) {
                            container.classList.add('training-error');
                        }
                    }
                });
            });
            
            // 3秒后自动清除错误
            setTimeout(() => {
                this.clearTrainingError();
            }, 3000);
        },
        
        // 清除培训错误
        clearTrainingError() {
            this.trainingErrors = [];
            
            // 移除错误样式
            this.$nextTick(() => {
                const containers = document.querySelectorAll('.video-container');
                containers.forEach(container => {
                    container.classList.remove('training-error');
                });
            });
        },
        
        // 进入培训模式
        enterTrainingMode() {
            console.log('Box组件进入培训模式');
            this.isTrainingMode = true;
        },
        
        // 退出培训模式
        exitTrainingMode() {
            console.log('Box组件退出培训模式');
            this.isTrainingMode = false;
            this.highlightedEquipments = [];
            this.trainingErrors = [];
            
            // 移除所有高亮和错误样式
            this.$nextTick(() => {
                const containers = document.querySelectorAll('.video-container');
                containers.forEach(container => {
                    container.classList.remove('highlighted');
                    container.classList.remove('training-error');
                });
                
                // 移除渲染任务
                this.$EventBus.$emit('removeRenderTask', 'boxHighlight');
            });
        },
        // 处理设备操作
        handleDeviceOperation(data) {
            console.log('Box组件接收到设备操作:', data);
            
            // 查找对应的设备
            const equipmentIndex = this.findEquipmentIndexById(data.deviceId);
            
            // 即使找不到设备，也尝试通知培训模式
            // 这是为了解决主电源在培训模式下可能找不到的问题
            if (this.isTrainingMode) {
                // 根据操作类型转换为连接状态
                const isConnected = data.operation === 'close'; // close操作表示接通电源
                
                console.log(`培训模式下设备操作: ${data.deviceId}, 操作: ${data.operation}, 连接状态: ${isConnected}`);
                
                // 通知培训模式组件设备状态变化
                this.$EventBus.$emit('circuitDeviceStateChange', {
                    deviceId: data.deviceId,
                    isConnected: isConnected
                });
            }
            
            if (equipmentIndex === -1) {
                console.log(`未找到设备: ${data.deviceId}`);
                return;
            }
            
            const equipment = this.currentConfig.equipmentList[equipmentIndex];
            console.log('找到设备:', equipment);
            
            // 根据操作类型播放对应的视频
            if (data.operation === 'open') {
                this.playVideo(equipmentIndex);
            } else if (data.operation === 'close') {
                this.playVideo(equipmentIndex);
            }
        },
        // 加载媒体资源
        loadMedia() {
            if (!this.currentConfig || !this.currentConfig.equipmentList) {
                console.error('无法加载媒体：配置无效');
                return;
            }
            
            console.log('加载媒体资源...');
            
            // 清理当前状态
            this.currentEquipmentIds = [];
            
            // 加载设备媒体
            this.currentConfig.equipmentList.forEach((equipment, index) => {
                if (equipment.video) {
                    console.log(`加载视频: ${equipment.id} - ${equipment.title}`);
                    this.currentEquipmentIds.push(equipment.id);
                }
            });
            
            console.log('媒体资源加载完成');
        },
    },
    mounted() {
        console.log('Box组件已挂载');
        
        // 监听显示/隐藏事件
        EventBus.$on('showBox', (data) => {
            console.log('收到showBox事件:', data);
            this.visible = data.show;
            
            if (data.show && data.config) {
                this.currentConfig = data.config;
                this.loadMedia();
                // 打开面板时同步一次电路图中的设备状态
                this.syncWithCircuitStatus();
            }
            
            if (data.show) {
                document.addEventListener('click', this.handleOutsideClick);
            } else {
                document.removeEventListener('click', this.handleOutsideClick);
            }
        });
        
        // 监听培训模式事件
        EventBus.$on('boxStartTraining', () => {
            console.log('Box组件进入培训模式');
            this.isTrainingMode = true;
        });
        
        EventBus.$on('boxExitTraining', () => {
            console.log('Box组件退出培训模式');
            this.isTrainingMode = false;
            this.highlightedEquipments = [];
            this.trainingErrors = [];
            
            // 移除所有高亮样式
            this.$nextTick(() => {
                const containers = document.querySelectorAll('.video-container');
                containers.forEach(container => {
                    container.classList.remove('highlighted');
                    container.classList.remove('training-error');
                });
                
                // 移除渲染任务
                this.$EventBus.$emit('removeRenderTask', 'boxHighlight');
            });
        });
        
        // 监听高亮设备事件
        EventBus.$on('boxUpdateHighlight', (data) => {
            console.log('收到boxUpdateHighlight事件:', data);
            this.updateHighlightedEquipments(data.highlightedEquipments || []);
        });
        
        // 监听设备操作事件
        EventBus.$on('deviceOperation', (data) => {
            console.log('收到deviceOperation事件:', data);
            this.handleDeviceOperation(data);
        });
        
        // 监听电路图培训模式事件
        EventBus.$on('circuitStartTraining', (data) => {
            console.log('Box组件响应电路图培训开始:', data);
            this.isTrainingMode = true;
            // 可以根据需要处理培训配置
        });
        
        EventBus.$on('circuitExitTraining', () => {
            console.log('Box组件响应电路图培训结束');
            this.isTrainingMode = false;
            this.highlightedEquipments = [];
            this.trainingErrors = [];
        });
    },
    beforeDestroy() {
        // 移除事件监听
        EventBus.$off('showBox');
        EventBus.$off('boxStartTraining');
        EventBus.$off('boxExitTraining');
        EventBus.$off('boxUpdateHighlight');
        EventBus.$off('deviceOperation');
        EventBus.$off('circuitStartTraining');
        EventBus.$off('circuitExitTraining');
        
        document.removeEventListener('click', this.handleOutsideClick);
        
        // 清理渲染任务
        this.$EventBus.$emit('removeRenderTask', 'boxHighlight');
    }
};
</script>

<style lang="less" scoped>
.box {
    position: fixed;
    top: 120px;
    left: 20px;
    width: 500px;
    height: 800px;
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
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        height: calc(100% - 80px);
        padding: 0;
        box-sizing: border-box;
        overflow-y: auto;
        gap: 0;

        // 添加与cable.vue相同的滚动条样式
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

    .video-container {
        margin: 0;
        padding: 0;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 0;
        border: none;
        border-bottom: 1px solid rgba(0, 255, 255, 0.3);
        box-shadow: none;
        position: relative;
        color: #fff;

        .cabinet-header {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            margin: 0;
            padding: 0;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            z-index: 2;

            h3 {
                margin: 0 0 0 8px;
                font-size: 16px;
                font-weight: 500;
            }
        }

        .power-badge {
            min-width: 80px;
            padding: 2px 8px;
            font-size: 12px;
            line-height: 1.4;
            color: #00ffcc;
            background: rgba(0, 0, 0, 0.75);
            border: 1px solid rgba(0, 255, 204, 0.8);
            border-radius: 12px;
            box-shadow: 0 0 8px rgba(0, 255, 204, 0.6);
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 3;
            pointer-events: none;
        }

        &:first-child .box-video,
        &:first-child .box-video-b,
        &:first-child .box-video-c,
        &:first-child .box-video-d,
        &:first-child .box-image {
            border-radius: 0;
        }

        &:last-child .box-video,
        &:last-child .box-video-b,
        &:last-child .box-video-c,
        &:last-child .box-video-d,
        &:last-child .box-image {
            border-radius: 0;
        }

        &:only-child .box-video,
        &:only-child .box-video-b,
        &:only-child .box-video-c,
        &:only-child .box-video-d,
        &:only-child .box-image {
            border-radius: 0;
        }

        h3 {
            position: absolute;
            top: 6px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10;
            color: #00e5ff;
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            padding: 4px 14px;
            margin: 0;
            background: linear-gradient(180deg, 
                rgba(0, 50, 100, 0.92) 0%, 
                rgba(0, 40, 80, 0.88) 100%);
            border: 1px solid rgba(0, 180, 255, 0.7);
            border-radius: 3px;
            text-shadow: 0 0 8px rgba(0, 229, 255, 0.6);
            white-space: nowrap;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5), 
                        0 0 12px rgba(0, 180, 255, 0.3);
            backdrop-filter: blur(4px);
        }
    }

    .box-video {
        display: block;
        width: 450px;
        height: 100px;
        object-fit: cover;
        cursor: pointer;
        position: relative;
        z-index: 1;
        border-radius: 0;
        border: none;
        border-bottom: none;

        &::-webkit-media-controls {
            display: none !important;
        }
    }

    .box-video-b {
        height: 400px;
        border-radius: 0;
        border: none;
    }
    
    .box-video-c {
        height: 350px;
        width: 450px;
        object-fit: contain;
        border-radius: 0;
        border: none;
        box-shadow: none;
    }

    .box-video-d {
        height: 260px;
        width: 450px;
        object-fit: contain;
        border-radius: 0;
        border: none;
        box-shadow: none;
    }

    .box-image {
        display: block;
        width: 450px;
        height: 300px;
        object-fit: cover;
        cursor: pointer;
        position: relative;
        z-index: 1;
        border-radius: 0;
        border: none;
    }
}

// 整体容器外边框
.box-content {
    .video-container:first-child {
        .box-video, .box-video-b, .box-video-c, .box-video-d, .box-image {
            border-top: none;
        }
    }
}

// 添加设备高亮效果
.highlight-equipment {
  animation: pulse-highlight 2s ease-in-out;
  position: relative;
}

.highlight-equipment::before {
  content: '';
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  border: 2px solid #52c41a;
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(82, 196, 26, 0.8);
  animation: border-pulse 2s ease-in-out;
  pointer-events: none;
  z-index: 10;
}

@keyframes pulse-highlight {
  0% { transform: scale(1); }
  10% { transform: scale(1.05); }
  20% { transform: scale(1); }
  30% { transform: scale(1.03); }
  40% { transform: scale(1); }
  100% { transform: scale(1); }
}

@keyframes border-pulse {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}

// 仅保留错误提示相关样式
.error-message {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 450px;
    height: 100px;
    background: rgba(255, 0, 0, 0.1);
    color: #ff6b6b;
    font-size: 18px;
    
    button {
        margin-top: 10px;
        background: #4080ff;
        color: white;
        border: none;
        padding: 5px 15px;
        border-radius: 4px;
        cursor: pointer;
        
        &:hover {
            background: #5090ff;
        }
    }
}

.video-container.error {
    position: relative;
    
    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 0, 0, 0.05);
        pointer-events: none;
    }
}

/* 培训模式相关样式 */
.video-container.highlighted {
  border: 3px solid rgba(255, 204, 0, 0.9) !important;
  box-shadow: 0 0 15px 5px rgba(255, 204, 0, 0.8) !important;
  position: relative;
  z-index: 10;
  animation: highlight-pulse 1s infinite alternate;
}

.video-container.training-error {
  border: 3px solid rgba(255, 0, 0, 0.9) !important;
  box-shadow: 0 0 15px 5px rgba(255, 0, 0, 0.8) !important;
  position: relative;
  z-index: 10;
  animation: error-pulse 1s infinite alternate;
}

@keyframes highlight-pulse {
  0% {
    box-shadow: 0 0 5px 1px rgba(255, 204, 0, 0.5);
    border-color: rgba(255, 204, 0, 0.5);
  }
  100% {
    box-shadow: 0 0 20px 5px rgba(255, 204, 0, 0.9);
    border-color: rgba(255, 204, 0, 1);
  }
}

@keyframes error-pulse {
  0% {
    box-shadow: 0 0 5px 1px rgba(255, 0, 0, 0.5);
    border-color: rgba(255, 0, 0, 0.5);
  }
  100% {
    box-shadow: 0 0 20px 5px rgba(255, 0, 0, 0.9);
    border-color: rgba(255, 0, 0, 1);
  }
}
</style>