/**
 * 电路图配置文件
 * 包含各个配电室的电路图数据
 * 结构设计考虑了实际电路拓扑关系和断电顺序（先断负载侧，再断总闸）
 */

// A座配电室电路图数据
export const roomACircuit = {
    id: 'A-PowerRoom',
    title: 'A座配电室',
    description: 'A座配电室供电系统示意图 - 断电操作请先断开负载侧，再断开总闸',
    deviceList: [
        {
            id: '15AL1-1',
            title: '15AL1',
            connected: true,
            isParent: true,
            type: 'main-power',
            children: [
                {
                    id: '15AL2',
                    title: '15AL2',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '15AL2-1',
                            title: '15#电容柜',
                            connected: true,
                            isEndDevice: true,
                            type: 'capacitor-bank',
                        },

                    ]
                },
                {
                    id: '15AL3',
                    title: '15AL3',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '15AL3-1',
                            title: '15#电容柜',
                            connected: true,
                            isEndDevice: true,
                            type: 'capacitor-bank',
                        },

                    ]
                },
                {
                    id: '15AL4',
                    title: '15AL4',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '15AL4-1',
                            title: '人防应急照明（主）',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL4-2',
                            title: '地下层应急照明（主）',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL4-3',
                            title: '地上层西侧应急照明(备)1-6层',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL4-4',
                            title: '地上层东侧应急照明(主)1-6层',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL4-5',
                            title: '地上南侧应急照明(备)照明1-3层',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL4-6',
                            title: '6层弱电机房电源2(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL4-7',
                            title: '地下层消防风机(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        }, {
                            id: '15AL4-8',
                            title: '首层消防控制室(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        }
                    ]
                },

                {
                    id: '15AL5',
                    title: '15AL5',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '15AL5-1',
                            title: '屋顶消防风机水泵(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL5-2',
                            title: '地下层消防水泵房(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL5-3',
                            title: '地下层生活泵房(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL5-4',
                            title: '地下层人防(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL5-5',
                            title: '地下层变电站用电(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL5-6',
                            title: '地下层非消防二级电力负荷(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL5-7',
                            title: '地下层非消防二级照明负荷(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        }
                    ]
                },
                {
                    id: '15AL6',
                    title: '15AL6',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '15AL6-1',
                            title: '6层弱电机房(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL6-2',
                            title: '东侧监控工作站及安全评估实验室(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL6-3',
                            title: '西侧金属实验室及机组防控实验室',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL6-4',
                            title: '西侧一层电镜实验室(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL6-5',
                            title: '西侧一层力学性能实验室(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL6-6',
                            title: '中部电梯(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL6-7',
                            title: '高压大厅消防(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        }
                    ]
                },
                {
                    id: '15AL7',
                    title: '15AL7',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '15AL7-1',
                            title: '西侧电梯(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL7-2',
                            title: '东侧电梯(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL7-3',
                            title: '至综合屏',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL7-4',
                            title: '四层信息机房（北USP）',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL7-5',
                            title: '东侧UPS电源间设备(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        }
                    ]
                },
                {
                    id: '15AL8',
                    title: '15AL8',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '15AL8-1',
                            title: '东侧UPS电源间空调及中心机房空调(电缆主桥架)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL8-2',
                            title: '西侧地上公共照明(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL8-3',
                            title: '东侧地上公共照明(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL8-4',
                            title: '南侧地上公共照明(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL8-5',
                            title: '东侧UPS电源间及中心机房照明(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL8-6',
                            title: '三层南侧多功能厅及学术报告照明(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        }
                    ]
                },
                {
                    id: '15AL9',
                    title: '15AL9',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '15AL9-1',
                            title: '东侧电热开水器电源',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL9-2',
                            title: '本室空调电源',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL9-3',
                            title: ' 514电网400V电流柜',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL9-4',
                            title: '东侧新风机房电源',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL9-5',
                            title: '小螺杆机组水泵电源(控制室',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL9-6',
                            title: '四层东空调备用电源',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        }
                    ]
                },
                {
                    id: '15AL10',
                    title: '15AL10',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '15AL10-1',
                            title: '东侧1-3层实验室电力干线',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        }
                    ]
                },
                {
                    id: '15AL11',
                    title: '15AL11',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '15AL11-1',
                            title: '东侧4-6层实验室电力干线(电缆至桥架)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL11-2',
                            title: '小螺杆机组电源(电缆至桥架)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '15AL11-3',
                            title: '备用',
                            connected: true,
                            isEndDevice: true
                        }
                    ]
                },
                {
                    id: '15AL12',
                    title: '15AL12',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '15AL11-1',
                            title: '母联柜',
                            connected: true
                        },
                    ]
                },

                // 高压设备配置
                // {
                //     id: '2AH1',
                //     title: '2AH1',
                //     connected: true,
                //     isParent: true,
                //     children: [
                //         {
                //             id: '2AH1',
                //             title: '2AH1',
                //             connected: true,
                //             isEndDevice: true
                //         }
                //     ]
                // },
                // {
                //     id: '2AH2',
                //     title: '2AH2',
                //     connected: true,
                //     isParent: true,
                //     children: [
                //         {
                //             id: '2AH2',
                //             title: '2AH2',
                //             connected: true,
                //             isEndDevice: true
                //         }
                //     ]
                // },
                // {
                //     id: '2AH3',
                //     title: '2AH3',
                //     connected: true,
                //     isParent: true,
                //     children: [
                //         {
                //             id: '2AH3',
                //             title: '2AH3',
                //             connected: true,
                //             isEndDevice: true
                //         }
                //     ]
                // },
                // {
                //     id: '2AH4',
                //     title: '2AH4',
                //     connected: true,
                //     isParent: true,
                //     children: [
                //         {
                //             id: '2AH4',
                //             title: '2AH4',
                //             connected: true,
                //             isEndDevice: true
                //         }
                //     ]
                // },
                // {
                //     id: '2AH5',
                //     title: '2AH5',
                //     connected: true,
                //     isParent: true,
                //     children: [
                //         {
                //             id: '2AH5',
                //             title: '2AH5',
                //             connected: true,
                //             isEndDevice: true
                //         }
                //     ]
                // },
                // {
                //     id: '2AH6',
                //     title: '2AH6',
                //     connected: true,
                //     isParent: true,
                //     children: [
                //         {
                //             id: '2AH6',
                //             title: '2AH6',
                //             connected: true,
                //             isEndDevice: true
                //         }
                //     ]
                // },
                // {
                //     id: '2AH7',
                //     title: '2AH7',
                //     connected: true,
                //     isParent: true,
                //     children: [
                //         {
                //             id: '2AH7',
                //             title: '2AH7',
                //             connected: true,
                //             isEndDevice: true
                //         }
                //     ]
                // },
                // {
                //     id: '2AH8',
                //     title: '2AH8',
                //     connected: true,
                //     isParent: true,
                //     children: [
                //         {
                //             id: '2AH8',
                //             title: '2AH8',
                //             connected: true,
                //             isEndDevice: true
                //         }
                //     ]
                // },
                // {
                //     id: '1AH9',
                //     title: '1AH9',
                //     connected: true,
                //     isParent: true,
                //     children: [
                //         {
                //             id: '1AH9',
                //             title: '1AH9',
                //             connected: true,
                //             isEndDevice: true
                //         }
                //     ]
                // },
                // {
                //     id: '1AH8',
                //     title: '1AH8',
                //     connected: true,
                //     isParent: true,
                //     children: [
                //         {
                //             id: '1AH8',
                //             title: '1AH8',
                //             connected: true,
                //             isEndDevice: true
                //         }
                //     ]
                // },
                // {
                //     id: '1AH7',
                //     title: '1AH7',
                //     connected: true,
                //     isParent: true,
                //     children: [
                //         {
                //             id: '1AH7',
                //             title: '1AH7',
                //             connected: true,
                //             isEndDevice: true
                //         }
                //     ]
                // },
                // {
                //     id: '1AH6',
                //     title: '1AH6',
                //     connected: true,
                //     isParent: true,
                //     children: [
                //         {
                //             id: '1AH6',
                //             title: '1AH6',
                //             connected: true,
                //             isEndDevice: true
                //         }
                //     ]
                // },
                // {
                //     id: '1AH5',
                //     title: '1AH5',
                //     connected: true,
                //     isParent: true,
                //     children: [
                //         {
                //             id: '1AH5',
                //             title: '1AH5',
                //             connected: true,
                //             isEndDevice: true
                //         }
                //     ]
                // },
                // {
                //     id: '1AH4',
                //     title: '1AH4',
                //     connected: true,
                //     isParent: true,
                //     children: [
                //         {
                //             id: '1AH4',
                //             title: '1AH4',
                //             connected: true,
                //             isEndDevice: true
                //         }
                //     ]
                // },
                // {
                //     id: '1AH3',
                //     title: '1AH3',
                //     connected: true,
                //     isParent: true,
                //     children: [
                //         {
                //             id: '1AH3',
                //             title: '1AH3',
                //             connected: true,
                //             isEndDevice: true
                //         }
                //     ]
                // },
                // {
                //     id: '1AH2',
                //     title: '1AH2',
                //     connected: true,
                //     isParent: true,
                //     children: [
                //         {
                //             id: '1AH2',
                //             title: '1AH2',
                //             connected: true,
                //             isEndDevice: true
                //         }
                //     ]
                // }
            ]
        }, {
            id: "16AL1-1",
            title: "16AL1",
            connected: false,
            isParent: true,
            type: 'main-power',
            children: [
                //16AL  

                {
                    id: '16AL2',
                    title: '16AL2',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '16AL2-1',
                            title: '16#电容柜',
                            connected: true,
                            isEndDevice: true,
                            type: 'capacitor-bank',
                        }
                    ]
                },
                {
                    id: '16AL3',
                    title: '16AL3',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '16AL3-1',
                            title: '16#电容柜',
                            connected: true,
                            isEndDevice: true,
                            type: 'capacitor-bank',
                        }
                    ]
                },
                {
                    id: '16AL4',
                    title: '16AL4',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '16AL4-1',
                            title: '人防应急照明(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL4-2',
                            title: '地下层应急照明(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL4-3',
                            title: '地上西侧应急照明(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL4-4',
                            title: '地上东侧应急照明(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL4-5',
                            title: '地上南侧应急照明(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL4-6',
                            title: '6层弱电机房电源2(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL4-7',
                            title: '地下层消防风机(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL4-8',
                            title: '首层消防控制室(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        }
                    ]
                },
                {
                    id: '16AL5',
                    title: '16AL5',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '16AL5-1',
                            title: '屋顶消防风机水泵(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL5-2',
                            title: '地下层消防泵房',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL5-3',
                            title: '地下层生活泵房(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL5-4',
                            title: '地下层人防(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL5-5',
                            title: '地下层变电站用电(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL5-6',
                            title: '地下层非消防二级电力负荷(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL5-7',
                            title: '地下层非消防二级照明负荷(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        }
                    ]
                },
                {
                    id: '16AL6',
                    title: '16AL6',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '16AL6-1',
                            title: '首层弱电机房(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL6-2',
                            title: '东侧监控工作站及安全评估实验室(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL6-3',
                            title: '西侧金属实验室及机组防控实验室(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL6-4',
                            title: '西侧一层电梯(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL6-5',
                            title: '西一层力学性能实验室(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL6-6',
                            title: '中部电梯(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL6-7',
                            title: '四层东空调(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        }
                    ]
                },
                {
                    id: '16AL7',
                    title: '16AL7',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '16AL7-1',
                            title: '西侧电梯(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL7-2',
                            title: '东侧电梯(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL7-3',
                            title: '至综合屏',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL7-4',
                            title: '四层信息机房(南市店)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL7-5',
                            title: '东侧UPS电源间设备(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        }
                    ]
                },
                {
                    id: '16AL8',
                    title: '16AL8',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '16AL8-1',
                            title: '东侧UPS电源间及中心机房空调(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL8-2',
                            title: '西侧地上公共照明(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL8-3',
                            title: '东侧地上公共照明(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL8-4',
                            title: '南侧地上公共照明(主)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL8-5',
                            title: '东侧UPS电源间及中心机房照明(备)',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL8-6',
                            title: '二层南侧多功能厅及学术报告照明',
                            connected: true,
                            isEndDevice: true,
                        type: 'equipment'
                        }
                    ]
                },
                {
                    id: '16AL9',
                    title: '16AL9',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '16AL9-1',
                            title: '地上西侧实验室电力干线(1-6层)',
                            connected: true,
                        type: 'equipment'
                        },

                    ]
                },
                {
                    id: '16AL10',
                    title: '16AL10',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '16AL10-1',
                            title: '大螺杆制冷机组一电源',
                            connected: true,
                        type: 'equipment'
                        },
                        {
                            id: '16AL10-2',
                            title: '大螺杆制冷机组二电源',
                            connected: true,
                        type: 'equipment'
                        }
                    ]
                }, {
                    id: '16AL11',
                    title: '16AL11',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '16AL11-1',
                            title: '母联柜',
                            connected: true
                        },
                    ]
                },
            ]
        }
    ]
};

// B座配电室电路图数据
export const roomBCircuit = {
    id: 'B-PowerRoom',
    title: 'B座配电室',
    description: 'B座配电室供电系统示意图 - 断电操作请先断开负载侧，再断开总闸',
    deviceList: [
        {
            id: 'main-power-b',
            title: '主电源',
            connected: true,
            isParent: true,
            type: 'main-power',
            children: [
                {
                    id: 'AE',
                    title: '照明与风机系统',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: 'AE-1',
                            title: '高低压室及电源室照明',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: 'AE-2',
                            title: 'A区排潮风机',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: 'AE-3',
                            title: 'BC区排潮风机',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: 'AE-4',
                            title: '备用',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: 'AE-5',
                            title: '备用',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: 'AE-6',
                            title: '备用',
                            connected: true,
                            isEndDevice: true
                        }
                    ]
                },
                {
                    id: '6AL',
                    title: '出线系统',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '6AL-1',
                            title: '出线一',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '6AL-2',
                            title: '出线二',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '6AL-3',
                            title: '出线三',
                            connected: true,
                            isEndDevice: true
                        }
                    ]
                },
                {
                    id: '4AL',
                    title: '照明系统',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '4AL-1',
                            title: 'A区照明',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '4AL-2',
                            title: 'BC区照明',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '4AL-3',
                            title: 'D区照明',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '4AL-4',
                            title: '高低压室及电源室照明',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '4AL-5',
                            title: 'BC排潮风',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '4AL-6',
                            title: '备用',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '4AL-7',
                            title: '备用',
                            connected: true,
                            isEndDevice: true
                        }
                    ]
                },
                {
                    id: '3AL',
                    title: '试验装置系统',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: '3AL-1',
                            title: '3AL总开关',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '3AL-2',
                            title: '3600KV冲击试验装置',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '3AL-3',
                            title: '1800KV冲击试验装置',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '3AL-4',
                            title: '备用',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '3AL-5',
                            title: '1500KV工频控制台',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '3AL-6',
                            title: '550KV工频控制台',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '3AL-7',
                            title: '3600KV冲击控制台',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '3AL-8',
                            title: '1800KV冲击控制台',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '3AL-9',
                            title: '淋雨装置控制台',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '3AL-10',
                            title: '直流屏',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '3AL-11',
                            title: '备用',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '3AL-12',
                            title: '淋雨试验装置',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '3AL-13',
                            title: '备用',
                            connected: true,
                            isEndDevice: true
                        },
                        {
                            id: '3AL-14',
                            title: '互感器误差检验装置',
                            connected: true,
                            isEndDevice: true
                        }
                    ]
                },
                {
                    id: 'AH5',
                    title: 'AH5',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: 'AH5-1',
                            title: 'AH5',
                            connected: true,
                            isEndDevice: true
                        },

                    ]
                }, {
                    id: 'XGN2-12',
                    title: 'XGN2-12',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: 'XGN2-12',
                            title: 'XGN2-12',
                            connected: true,
                            isEndDevice: true
                        },

                    ]
                }, {
                    id: 'AH1',
                    title: 'AH1',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: 'AH1',
                            title: 'AH1',
                            connected: true,
                            isEndDevice: true
                        },

                    ]
                }, {
                    id: 'AH2',
                    title: 'AH2',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: 'AH2',
                            title: 'AH2',
                            connected: true,
                            isEndDevice: true
                        },

                    ]
                }, {
                    id: 'AH3',
                    title: 'AH3',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: 'AH3',
                            title: 'AH3',
                            connected: true,
                            isEndDevice: true
                        },

                    ]
                },
                {
                    id: 'AH4',
                    title: 'AH4',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: 'AH4',
                            title: 'AH4',
                            connected: true,
                            isEndDevice: true
                        },

                    ]
                }, {
                    id: 'XGN2-12',
                    title: 'XGN2-12',
                    connected: true,
                    isParent: true,
                    children: [
                        {
                            id: 'XGN2-12',
                            title: 'XGN2-12',
                            connected: true,
                            isEndDevice: true
                        },

                    ]
                },
            ]
        }
    ]
};

// D座配电室电路图数据
export const roomDCircuit = {
    id: 'D-PowerRoom',
    title: 'D座配电室',
    description: 'D座配电室供电系统示意图 - 断电操作请先断开负载侧，再断开总闸',
    deviceList: [
        {
            id: 'main-power-d',
            title: '主电源',
            connected: true,
            isParent: true,
            type: 'main-power',
            children: [{
                id: '11AL1',
                title: '11AL1',
                connected: true,
                isParent: true,
                children: [
                    {
                        id: '11AL1-1',
                        title: '主进柜',
                        connected: true,
                        isEndDevice: true
                    },

                ]
            }, {
                id: '11AL2',
                title: '11AL2',
                connected: true,
                isParent: true,
                children: [
                    {
                        id: '11AL2-1',
                        title: '电容柜',
                        connected: true,
                        isEndDevice: true
                    },

                ]
            }, {
                id: '11AL3',
                title: '11AL3',
                connected: true,
                isParent: true,
                children: [
                    {
                        id: '11AL3-1',
                        title: '电容柜',
                        connected: true,
                        isEndDevice: true
                    },

                ]
            },
            {
                id: '11AL4',
                title: '11AL4',
                connected: true,
                isParent: true,
                children: [
                    {
                        id: '11AL4-1',
                        title: '备用',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    }, {
                        id: '11AL4-2',
                        title: '备用',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    }, {
                        id: '11AL4-3',
                        title: '备用',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    },
                    {
                        id: '11AL4-4',
                        title: '电梯(主) M11',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    },
                    {
                        id: '11AL4-5',
                        title: '3-5层照明N10',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    },
                    {
                        id: '11AL4-6',
                        title: '洗衣房N7',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    },
                    {
                        id: '11AL4-7',
                        title: '交直流一体化电源屏(备)',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    }
                ]
            },
            {
                id: '11AL5',
                title: '11AL5',
                connected: true,
                isParent: true,
                children: [
                    {
                        id: '11AL5-1',
                        title: '备用',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    },
                    {
                        id: '11AL5-2',
                        title: '后厨AP4',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    },
                    {
                        id: '11AL5-3',
                        title: '6-8层照明N9',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    },
                    {
                        id: '11AL5-4',
                        title: '网络机房(备)N2',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    }, {
                        id: '11AL5-5',
                        title: '备用',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    }, {
                        id: '11AL5-6',
                        title: '备用',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    },
                ]
            },
            {
                id: '11AL6',
                title: '11AL6',
                connected: true,
                isParent: true,
                children: [
                    {
                        id: '11AL6-1',
                        title: '西侧制冷机组',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    }
                ]
            }, {
                id: '10AL7',
                title: '10AL7',
                connected: true,
                isParent: true,
                children: [
                    {
                        id: '10AL7-1',
                        title: '母联开关柜',
                        connected: true,
                        isEndDevice: true
                    }
                ]
            },
            {
                id: '10AL6',
                title: '10AL6',
                connected: true,
                isParent: true,
                children: [
                    {
                        id: '10AL6-1',
                        title: '东侧制冷机组',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    }
                ]
            },
            {
                id: '10AL5',
                title: '10AL5',
                connected: true,
                isParent: true,
                children: [
                    {
                        id: '10AL5-1',
                        title: '1-2层照明M10',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    },
                    {
                        id: '10AL5-2',
                        title: '9-10层照明M9',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    }, {
                        id: '10AL5-3',
                        title: '备用',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    },
                    {
                        id: '10AL5-4',
                        title: '网络机房(主)M2',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    }, {
                        id: '10AL5-5',
                        title: '备用',
                        connected: true,
                        isEndDevice: true,
                        type: 'equipment'
                    }
                ]
            },
            {
                id: '10AL4',
                title: '10AL4',
                connected: true,
                isParent: true,
                children: [{
                    id: '10AL4-1',
                    title: '备用',
                    connected: true,
                    isEndDevice: true,
                    type: 'equipment'
                },
                {
                    id: '10AL4-2',
                    title: '电梯备用',
                    connected: true,
                    isEndDevice: true,
                    type: 'equipment'
                },
                {
                    id: '10AL4-3',
                    title: '排污泵电梯#',
                    connected: true,
                    isEndDevice: true,
                    type: 'equipment'
                }, {
                    id: '10AL4-4',
                    title: '备用',
                    connected: true,
                    isEndDevice: true,
                    type: 'equipment'
                },
                {
                    id: '10AL4-5',
                    title: '交直流一体化电源屏(主)',
                    connected: true,
                    isEndDevice: true,
                    type: 'equipment'
                },
                {
                    id: '10AL4-6',
                    title: '备用太阳能',
                    connected: true,
                    isEndDevice: true,
                    type: 'equipment'
                }
                ]
            }, {
                id: '10AL3',
                title: '10AL3',
                connected: true,
                isParent: true,
                children: [{
                    id: '10AL3-1',
                    title: '电容柜',
                    connected: true,
                    isEndDevice: true
                },


                ]
            }, {
                id: '10AL2',
                title: '10AL2',
                connected: true,
                isParent: true,
                children: [{
                    id: '10AL2-1',
                    title: '电容柜',
                    connected: true,
                    isEndDevice: true
                },


                ]
            }, {
                id: '10AL1',
                title: '10AL1',
                connected: true,
                isParent: true,
                children: [{
                    id: '10AL1-1',
                    title: '主进柜',
                    connected: true,
                    isEndDevice: true
                },


                ]
            }, {
                id: '9AL1',
                title: '9AL1',
                connected: true,
                isParent: true,
                children: [{
                    id: '9AL1-1',
                    title: '9号主进柜',
                    connected: true,
                    isEndDevice: true
                },


                ]
            }, {
                id: '9AL2',
                title: '9AL2',
                connected: true,
                isParent: true,
                children: [{
                    id: '9AL2-1',
                    title: '9号主进柜',
                    connected: true,
                    isEndDevice: true
                },


                ]
            }, {
                id: '9AL3',
                title: '9AL3',
                connected: true,
                isParent: true,
                children: [{
                    id: '9AL3-1',
                    title: '9号电容柜',
                    connected: true,
                    isEndDevice: true
                },


                ]
            },
            {
                id: '9AL4',
                title: '9AL4',
                connected: true,
                isParent: true,
                children: [{
                    id: '9AL4-1',
                    title: '备用',
                    connected: true,
                    isEndDevice: true
                }, {
                    id: '9AL4-2',
                    title: '备用',
                    connected: true,
                    isEndDevice: true
                },
                {
                    id: '9AL4-3',
                    title: '制冷机房辅导L3',
                    connected: true,
                    isEndDevice: true
                },
                {
                    id: '9AL4-4',
                    title: '后厨AP5',
                    connected: true,
                    isEndDevice: true
                },
                {
                    id: '9AL4-5',
                    title: '景观照明M7',
                    connected: true,
                    isEndDevice: true
                }, {
                    id: '9AL4-6',
                    title: '备用',
                    connected: true,
                    isEndDevice: true
                },
                ]
            },
            {
                id: '9AL5',
                title: '9AL5',
                connected: true,
                isParent: true,
                children: [{
                    id: '9AL5-1',
                    title: '备用',
                    connected: true,
                    isEndDevice: true
                },
                {
                    id: '9AL5-2',
                    title: '研发阅览N6',
                    connected: true,
                    isEndDevice: true
                },
                {
                    id: '9AL5-3',
                    title: '消防风机水泵(主)M1',
                    connected: true,
                    isEndDevice: true
                }, {
                    id: '9AL5-4',
                    title: '备用',
                    connected: true,
                    isEndDevice: true
                }, {
                    id: '9AL5-5',
                    title: '备用',
                    connected: true,
                    isEndDevice: true
                }, {
                    id: '9AL5-6',
                    title: '备用',
                    connected: true,
                    isEndDevice: true
                }, {
                    id: '9AL5-7',
                    title: '备用',
                    connected: true,
                    isEndDevice: true
                },
                ]
            }, {
                id: '9AL6',
                title: '9AL6',
                connected: true,
                isParent: true,
                children: [{
                    id: '9AL6-1',
                    title: '备用',
                    connected: true,
                    isEndDevice: true
                },
                {
                    id: '9AL6-2',
                    title: '备用',
                    connected: true,
                    isEndDevice: true
                }, {
                    id: '9AL6-3',
                    title: '备用',
                    connected: true,
                    isEndDevice: true
                }, {
                    id: '9AL6-4',
                    title: '备用',
                    connected: true,
                    isEndDevice: true
                }, {
                    id: '9AL6-5',
                    title: '应急照明(备)',
                    connected: true,
                    isEndDevice: true
                }, {
                    id: '9AL6-6',
                    title: '空',
                    connected: true,
                    isEndDevice: true
                },

                ]
            }, {
                id: '9AL7',
                title: '9AL7',
                connected: true,
                isParent: true,
                children: [{
                    id: '9AL7-1',
                    title: '母联开关柜',
                    connected: true,
                    isEndDevice: true
                },

                ]
            },
            {
                id: '12AL6',
                title: '12AL6',
                connected: true,
                isParent: true,
                children: [
                    {
                        id: '12AL6-1',
                        title: '备用',
                        connected: true,
                        isEndDevice: true
                    },
                    {
                        id: '12AL6-2',
                        title: '消防水泵(备)N1',
                        connected: true,
                        isEndDevice: true
                    }, {
                        id: '12AL6-3',
                        title: '备用',
                        connected: true,
                        isEndDevice: true
                    },
                    {
                        id: '12AL6-4',
                        title: 'AWCF (AA1)厨房用电',
                        connected: true,
                        isEndDevice: true
                    }, {
                        id: '12AL6-5',
                        title: '备用',
                        connected: true,
                        isEndDevice: true
                    }, {
                        id: '12AL6-6',
                        title: '备用',
                        connected: true,
                        isEndDevice: true
                    }, {
                        id: '12AL6-7',
                        title: '备用',
                        connected: true,
                        isEndDevice: true
                    },
                ]
            },
            {
                id: '12AL5',
                title: '12AL5',
                connected: true,
                isParent: true,
                children: [{
                    id: '12AL5-1',
                    title: '空',
                    connected: true,
                    isEndDevice: true
                },
                {
                    id: '12AL5-2',
                    title: '多功能厅M6',
                    connected: true,
                    isEndDevice: true
                },
                {
                    id: '12AL5-3',
                    title: '备用',
                    connected: true,
                    isEndDevice: true
                },
                {
                    id: '12AL5-4',
                    title: ' AL21-AL31 M8',
                    connected: true,
                    isEndDevice: true
                }, {
                    id: '12AL5-5',
                    title: '备用',
                    connected: true,
                    isEndDevice: true
                }, {
                    id: '12AL5-6',
                    title: '备用',
                    connected: true,
                    isEndDevice: true
                }, {
                    id: '12AL5-7',
                    title: '备用',
                    connected: true,
                    isEndDevice: true
                },
                ]
            },
            {
                id: '12AL4',
                title: '12AL4',
                connected: true,
                isParent: true,
                children: [
                    {
                        id: '12AL4-1',
                        title: '冷#塔风机L5',
                        connected: true,
                        isEndDevice: true
                    },
                    {
                        id: '12AL4-2',
                        title: 'AP8后厨热水炉',
                        connected: true,
                        isEndDevice: true
                    },
                    {
                        id: '12AL4-3',
                        title: '人防用电(备)N3',
                        connected: true,
                        isEndDevice: true
                    },
                    {
                        id: '12AL4-5',
                        title: '制冷机房辅泵24',
                        connected: true,
                        isEndDevice: true
                    }
                ]
            },
            {
                id: '12AL3',
                title: '12AL3',
                connected: true,
                isParent: true,
                children: [

                    {
                        id: '12AL3-1',
                        title: '电容柜',
                        connected: true,
                        isEndDevice: true
                    }
                ]
            }, {
                id: '12AL2',
                title: '12AL2',
                connected: true,
                isParent: true,
                children: [

                    {
                        id: '12AL2-2',
                        title: '电容柜',
                        connected: true,
                        isEndDevice: true
                    }
                ]
            }, {
                id: '12AL1',
                title: '12AL1',
                connected: true,
                isParent: true,
                children: [

                    {
                        id: '12AL1-1',
                        title: '电容柜',
                        connected: true,
                        isEndDevice: true
                    }
                ]
            }, {
                id: '4AH1',
                title: '4AH1',
                connected: true,
                isParent: true,
                children: [

                    {
                        id: '4AH1-1',
                        title: '4AH1',
                        connected: true,
                        isEndDevice: true
                    }
                ]
            }, {
                id: '4AH2',
                title: '4AH2',
                connected: true,
                isParent: true,
                children: [

                    {
                        id: '4AH2-1',
                        title: '4AH2',
                        connected: true,
                        isEndDevice: true
                    }
                ]
            }, {
                id: '4AH3',
                title: '4AH3',
                connected: true,
                isParent: true,
                children: [

                    {
                        id: '4AH3-1',
                        title: '4AH3',
                        connected: true,
                        isEndDevice: true
                    }
                ]
            }, {
                id: '4AH4',
                title: '4AH4',
                connected: true,
                isParent: true,
                children: [

                    {
                        id: '4AH4-1',
                        title: '4AH4',
                        connected: true,
                        isEndDevice: true
                    }
                ]
            }, {
                id: '4AH5',
                title: '4AH5',
                connected: true,
                isParent: true,
                children: [

                    {
                        id: '4AH5-1',
                        title: '4AH5',
                        connected: true,
                        isEndDevice: true
                    }
                ]
            }, {
                id: '4AH6',
                title: '4AH6',
                connected: true,
                isParent: true,
                children: [

                    {
                        id: '4AH6-1',
                        title: '4AH6',
                        connected: true,
                        isEndDevice: true
                    }
                ]
            }, {
                id: '4AH7',
                title: '4AH7',
                connected: true,
                isParent: true,
                children: [

                    {
                        id: '4AH7-1',
                        title: '4AH7',
                        connected: true,
                        isEndDevice: true
                    }
                ]
            }, {
                id: '4AH8',
                title: '4AH8',
                connected: true,
                isParent: true,
                children: [

                    {
                        id: '4AH8-1',
                        title: '4AH8',
                        connected: true,
                        isEndDevice: true
                    }
                ]
            }, {
                id: '4AH9',
                title: '4AH9',
                connected: true,
                isParent: true,
                children: [

                    {
                        id: '4AH9-1',
                        title: '4AH9',
                        connected: true,
                        isEndDevice: true
                    }
                ]
            }, {
                id: '4AH10',
                title: '4AH10',
                connected: true,
                isParent: true,
                children: [

                    {
                        id: '4AH10-1',
                        title: '4AH10',
                        connected: true,
                        isEndDevice: true
                    }
                ]
            },
            ]
        }
    ]
};

// 导出所有配电室的电路图数据
const circuitConfig = {
    'A-PowerRoom': roomACircuit,
    'B-PowerRoom': roomBCircuit,
    'D-PowerRoom': roomDCircuit
};

export default circuitConfig;