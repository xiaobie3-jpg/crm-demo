import dayjs from 'dayjs'

// ==================== 用户 ====================
export interface User {
  id: number; name: string; role: 'admin' | 'manager' | 'sales'; dept: string;
}
export const users: User[] = [
  { id: 1, name: '大王', role: 'admin', dept: '管理层' },
  { id: 2, name: '张三', role: 'manager', dept: '销售一部' },
  { id: 3, name: '李四', role: 'sales', dept: '销售一部' },
  { id: 4, name: '王五', role: 'sales', dept: '销售一部' },
  { id: 5, name: '赵六', role: 'manager', dept: '销售二部' },
  { id: 6, name: '陈七', role: 'sales', dept: '销售二部' },
]

// ==================== 客户 ====================
export interface Customer {
  id: number; ownerId: number; code: string; level: string; name: string; contact: string; phone: string;
  assignDate: string; source: string; latestFollowup: string; latestFollowupDate: string;
  tags: string[]; remark: string; createdAt: string; status: 'normal' | 'sea'; seaEnterDate?: string;
  historyOwners?: { userId: number; name: string; date: string }[];
}
export const customers: Customer[] = [
  { id: 1, ownerId: 3, code: 'C001', level: '签约客户', name: '珠海新高度', contact: '刘总', phone: '13800138001', assignDate: '2025-06-01', source: '自拓', latestFollowup: '合同续约沟通', latestFollowupDate: '2026-06-02', tags: ['H5', '小程序'], remark: '长期合作客户', createdAt: '2025-06-01', status: 'normal' },
  { id: 2, ownerId: 3, code: 'C002', level: '签约客户', name: '金盾教育', contact: '王校', phone: '13800138002', assignDate: '2025-08-15', source: '小红书', latestFollowup: '二期项目需求确认', latestFollowupDate: '2026-05-28', tags: ['APP', 'AI'], remark: '续约率高', createdAt: '2025-08-15', status: 'normal' },
  { id: 3, ownerId: 4, code: 'C003', level: '靠谱客户', name: '轲影像', contact: '张导', phone: '13800138003', assignDate: '2026-01-10', source: '抖音', latestFollowup: '方案报价已发送', latestFollowupDate: '2026-06-05', tags: ['H5'], remark: '对云相册感兴趣', createdAt: '2026-01-10', status: 'normal' },
  { id: 4, ownerId: 4, code: 'C004', level: '签约客户', name: '保尔高', contact: '陈总', phone: '13800138004', assignDate: '2026-02-20', source: '百度', latestFollowup: '身高管理功能验收', latestFollowupDate: '2026-06-01', tags: ['小程序', '物联网'], remark: '身高管理项目', createdAt: '2026-02-20', status: 'normal' },
  { id: 5, ownerId: 6, code: 'C005', level: '意向客户', name: '分时租赁科技', contact: '杨经理', phone: '13800138005', assignDate: '2026-03-15', source: '百度', latestFollowup: '发送小程序案例', latestFollowupDate: '2026-06-03', tags: ['小程序', 'WEB'], remark: '', createdAt: '2026-03-15', status: 'normal' },
  { id: 6, ownerId: 6, code: 'C006', level: '潜在客户', name: '顾好家社区', contact: '周主任', phone: '13800138006', assignDate: '2026-04-20', source: 'GEO', latestFollowup: 'Demo演示中', latestFollowupDate: '2026-06-06', tags: ['WEB'], remark: 'Web demo开发中', createdAt: '2026-04-20', status: 'normal' },
  { id: 7, ownerId: 3, code: 'C007', level: '有效客户', name: '智慧物联', contact: '吴总', phone: '13800138007', assignDate: '2026-05-01', source: '淘宝', latestFollowup: '初次拜访', latestFollowupDate: '2026-05-20', tags: ['物联网', 'AI'], remark: '', createdAt: '2026-05-01', status: 'sea', seaEnterDate: '2026-06-01', historyOwners: [{ userId: 3, name: '李四', date: '2026-05-01' }] },
  { id: 8, ownerId: 0, code: 'C008', level: '潜在客户', name: '云端科技', contact: '黄总', phone: '13800138008', assignDate: '2026-01-05', source: '其他', latestFollowup: '电话沟通', latestFollowupDate: '2026-02-10', tags: [], remark: '', createdAt: '2026-01-05', status: 'sea', seaEnterDate: '2026-05-01', historyOwners: [{ userId: 1, name: '大王', date: '2026-01-05' }] },
  { id: 9, ownerId: 4, code: 'C009', level: '意向客户', name: '星云数据', contact: '郑经理', phone: '13800138009', assignDate: '2026-05-10', source: '百度', latestFollowup: '需求调研完成', latestFollowupDate: '2026-06-04', tags: ['AI', '客户端'], remark: '', createdAt: '2026-05-10', status: 'normal' },
  { id: 10, ownerId: 6, code: 'C010', level: '有效客户', name: '绿源环保', contact: '孙主任', phone: '13800138010', assignDate: '2026-06-01', source: '自拓', latestFollowup: '初次联系', latestFollowupDate: '2026-06-01', tags: ['H5', 'WEB'], remark: '', createdAt: '2026-06-01', status: 'normal' },
]

// ==================== 合同 ====================
export interface Contract {
  id: number; ownerId: number; customerId: number; name: string; contractNo: string;
  projectNo: string; phaseNo: string; autoNo: string; source: string; productType: string;
  amount: number; channelFee: number; ourReceivable: number; accumPayment: number;
  accumChannelFee: number; accumOurActual: number; unpaidAmount: number;
  signDate: string; expireDate: string; maintenanceFee: number; remark: string;
  status: 'pending' | 'executing' | 'completed' | 'terminated';
}
export const contracts: Contract[] = [
  { id: 1, ownerId: 3, customerId: 1, name: '新高度汽车管理系统一期', contractNo: 'H260115-001-01-01', projectNo: '01', phaseNo: '01', autoNo: '001', source: '自拓', productType: '定制首期', amount: 500000, channelFee: 0, ourReceivable: 500000, accumPayment: 300000, accumChannelFee: 0, accumOurActual: 300000, unpaidAmount: 200000, signDate: '2026-01-15', expireDate: '2026-07-15', maintenanceFee: 30000, remark: '', status: 'executing' },
  { id: 2, ownerId: 3, customerId: 1, name: '新高度汽车管理系统二期', contractNo: 'H260520-1599-01-02', projectNo: '01', phaseNo: '02', autoNo: '1599', source: '自拓', productType: '定制迭代', amount: 300000, channelFee: 0, ourReceivable: 300000, accumPayment: 150000, accumChannelFee: 0, accumOurActual: 150000, unpaidAmount: 150000, signDate: '2026-05-20', expireDate: '2026-11-20', maintenanceFee: 25000, remark: '二期迭代', status: 'executing' },
  { id: 3, ownerId: 3, customerId: 2, name: '金盾教育分销系统', contractNo: 'H260320-1600-01-01', projectNo: '01', phaseNo: '01', autoNo: '1600', source: '小红书', productType: '定制首期', amount: 400000, channelFee: 40000, ourReceivable: 360000, accumPayment: 400000, accumChannelFee: 40000, accumOurActual: 360000, unpaidAmount: 0, signDate: '2026-03-20', expireDate: '2026-09-20', maintenanceFee: 20000, remark: '已完成', status: 'completed' },
  { id: 4, ownerId: 4, customerId: 4, name: '保尔高身高管理小程序', contractNo: 'H260410-1601-01-01', projectNo: '01', phaseNo: '01', autoNo: '1601', source: '百度', productType: '定制首期', amount: 350000, channelFee: 35000, ourReceivable: 315000, accumPayment: 200000, accumChannelFee: 20000, accumOurActual: 180000, unpaidAmount: 150000, signDate: '2026-04-10', expireDate: '2026-10-10', maintenanceFee: 15000, remark: '', status: 'executing' },
  { id: 5, ownerId: 4, customerId: 3, name: '轲影像云相册', contractNo: 'H260608-1602-01-01', projectNo: '01', phaseNo: '01', autoNo: '1602', source: '抖音', productType: '定制首期', amount: 280000, channelFee: 0, ourReceivable: 280000, accumPayment: 0, accumChannelFee: 0, accumOurActual: 0, unpaidAmount: 280000, signDate: '2026-06-01', expireDate: '2026-12-01', maintenanceFee: 12000, remark: '新签', status: 'executing' },
  { id: 6, ownerId: 5, customerId: 5, name: '分时租赁小程序', contractNo: 'H260515-1603-01-01', projectNo: '01', phaseNo: '01', autoNo: '1603', source: '百度', productType: '模板新开', amount: 80000, channelFee: 8000, ourReceivable: 72000, accumPayment: 80000, accumChannelFee: 8000, accumOurActual: 72000, unpaidAmount: 0, signDate: '2026-05-15', expireDate: '2026-11-15', maintenanceFee: 5000, remark: '', status: 'completed' },
  { id: 7, ownerId: 6, customerId: 10, name: '绿源环保官网', contractNo: 'H260602-1604-01-01', projectNo: '01', phaseNo: '01', autoNo: '1604', source: '自拓', productType: '模板新开', amount: 50000, channelFee: 0, ourReceivable: 50000, accumPayment: 50000, accumChannelFee: 0, accumOurActual: 50000, unpaidAmount: 0, signDate: '2026-06-02', expireDate: '2026-12-02', maintenanceFee: 3000, remark: '', status: 'completed' },
  { id: 8, ownerId: 6, customerId: 10, name: '绿源环保小程序续费', contractNo: 'H260605-1605-01-01', projectNo: '01', phaseNo: '01', autoNo: '1605', source: '自拓', productType: '模板续费', amount: 15000, channelFee: 0, ourReceivable: 15000, accumPayment: 0, accumChannelFee: 0, accumOurActual: 0, unpaidAmount: 15000, signDate: '2026-06-05', expireDate: '2027-06-05', maintenanceFee: 3000, remark: '', status: 'executing' },
]

// ==================== 回款计划 ====================
export interface PaymentPlan {
  id: number; contractId: number; phase: string; amount: number; channelFee: number;
  ourReceivable: number; planDate: string; remark: string; status: 'pending' | 'paid' | 'overdue';
}
export const paymentPlans: PaymentPlan[] = [
  { id: 1, contractId: 1, phase: '首付款', amount: 200000, channelFee: 0, ourReceivable: 200000, planDate: '2026-01-30', remark: '', status: 'paid' },
  { id: 2, contractId: 1, phase: '中期款', amount: 200000, channelFee: 0, ourReceivable: 200000, planDate: '2026-04-30', remark: '', status: 'paid' },
  { id: 3, contractId: 1, phase: '尾款', amount: 100000, channelFee: 0, ourReceivable: 100000, planDate: '2026-06-30', remark: '', status: 'pending' },
  { id: 4, contractId: 2, phase: '首付款', amount: 150000, channelFee: 0, ourReceivable: 150000, planDate: '2026-05-31', remark: '', status: 'paid' },
  { id: 5, contractId: 2, phase: '尾款', amount: 150000, channelFee: 0, ourReceivable: 150000, planDate: '2026-08-31', remark: '', status: 'pending' },
  { id: 6, contractId: 4, phase: '首付款', amount: 150000, channelFee: 15000, ourReceivable: 135000, planDate: '2026-04-25', remark: '', status: 'paid' },
  { id: 7, contractId: 4, phase: '中期款', amount: 100000, channelFee: 10000, ourReceivable: 90000, planDate: '2026-06-15', remark: '', status: 'pending' },
  { id: 8, contractId: 4, phase: '尾款', amount: 100000, channelFee: 10000, ourReceivable: 90000, planDate: '2026-09-15', remark: '', status: 'pending' },
  { id: 9, contractId: 5, phase: '首付款', amount: 150000, channelFee: 0, ourReceivable: 150000, planDate: '2026-06-15', remark: '', status: 'pending' },
  { id: 10, contractId: 5, phase: '尾款', amount: 130000, channelFee: 0, ourReceivable: 130000, planDate: '2026-09-15', remark: '', status: 'pending' },
  { id: 11, contractId: 8, phase: '年费', amount: 15000, channelFee: 0, ourReceivable: 15000, planDate: '2026-06-15', remark: '', status: 'pending' },
  { id: 12, contractId: 3, phase: '首付款', amount: 250000, channelFee: 25000, ourReceivable: 225000, planDate: '2026-03-30', remark: '', status: 'paid' },
  { id: 13, contractId: 3, phase: '尾款', amount: 150000, channelFee: 15000, ourReceivable: 135000, planDate: '2026-06-30', remark: '', status: 'paid' },
]

// ==================== 回款记录 ====================
export interface PaymentRecord {
  id: number; contractId: number; planId: number; amount: number; channelFee: number;
  ourActual: number; method: string; actualDate: string; remark: string;
  status: 'pending' | 'approved' | 'rejected'; approverId?: number; submitterId: number;
}
export const paymentRecords: PaymentRecord[] = [
  { id: 1, contractId: 1, planId: 1, amount: 200000, channelFee: 0, ourActual: 200000, method: '银行转账', actualDate: '2026-02-01', remark: '', status: 'approved', approverId: 1, submitterId: 3 },
  { id: 2, contractId: 1, planId: 2, amount: 100000, channelFee: 0, ourActual: 100000, method: '银行转账', actualDate: '2026-05-02', remark: '', status: 'approved', approverId: 1, submitterId: 3 },
  { id: 3, contractId: 2, planId: 4, amount: 150000, channelFee: 0, ourActual: 150000, method: '微信支付', actualDate: '2026-06-01', remark: '', status: 'approved', approverId: 2, submitterId: 3 },
  { id: 4, contractId: 3, planId: 12, amount: 250000, channelFee: 25000, ourActual: 225000, method: '银行转账', actualDate: '2026-04-01', remark: '', status: 'approved', approverId: 1, submitterId: 3 },
  { id: 5, contractId: 3, planId: 13, amount: 150000, channelFee: 15000, ourActual: 135000, method: '银行转账', actualDate: '2026-07-01', remark: '', status: 'approved', approverId: 1, submitterId: 3 },
  { id: 6, contractId: 4, planId: 6, amount: 150000, channelFee: 15000, ourActual: 135000, method: '银行转账', actualDate: '2026-04-28', remark: '', status: 'approved', approverId: 1, submitterId: 4 },
  { id: 7, contractId: 4, planId: 6, amount: 50000, channelFee: 5000, ourActual: 45000, method: '微信支付', actualDate: '2026-05-10', remark: '补充回款', status: 'approved', approverId: 1, submitterId: 4 },
  { id: 8, contractId: 6, planId: 0, amount: 80000, channelFee: 8000, ourActual: 72000, method: '银行转账', actualDate: '2026-06-01', remark: '', status: 'approved', approverId: 2, submitterId: 5 },
  { id: 9, contractId: 7, planId: 0, amount: 50000, channelFee: 0, ourActual: 50000, method: '支付宝', actualDate: '2026-06-03', remark: '', status: 'approved', approverId: 2, submitterId: 6 },
  { id: 10, contractId: 5, planId: 9, amount: 150000, channelFee: 0, ourActual: 150000, method: '银行转账', actualDate: '2026-06-07', remark: '', status: 'pending', approverId: 0, submitterId: 4 },
]

// ==================== 渠道费支付 ====================
export interface ChannelFeeRecord {
  id: number; paymentRecordId: number; amount: number; payDate: string; status: string; remark: string;
}
export const channelFeeRecords: ChannelFeeRecord[] = [
  { id: 1, paymentRecordId: 4, amount: 25000, payDate: '2026-04-05', status: '已支付', remark: '' },
  { id: 2, paymentRecordId: 5, amount: 15000, payDate: '2026-07-03', status: '已支付', remark: '' },
  { id: 3, paymentRecordId: 6, amount: 15000, payDate: '2026-05-01', status: '已支付', remark: '' },
  { id: 4, paymentRecordId: 7, amount: 5000, payDate: '2026-05-15', status: '已支付', remark: '' },
  { id: 5, paymentRecordId: 8, amount: 8000, payDate: '2026-06-03', status: '已支付', remark: '' },
]

// ==================== 跟进记录 ====================
export interface Followup {
  id: number; ownerId: number; customerId: number; content: string; method: string; date: string;
}
export const followups: Followup[] = [
  { id: 1, ownerId: 3, customerId: 1, content: '合同续约沟通，客户有意向续签', method: '电话', date: '2026-06-02' },
  { id: 2, ownerId: 3, customerId: 2, content: '二期项目需求确认会议', method: '面谈', date: '2026-05-28' },
  { id: 3, ownerId: 4, customerId: 3, content: '方案报价已发送，等待客户反馈', method: '微信', date: '2026-06-05' },
  { id: 4, ownerId: 4, customerId: 4, content: '身高管理功能验收通过', method: '面谈', date: '2026-06-01' },
  { id: 5, ownerId: 6, customerId: 5, content: '发送小程序案例，客户表示意向', method: '微信', date: '2026-06-03' },
  { id: 6, ownerId: 6, customerId: 6, content: 'Demo演示中，客户反馈良好', method: '面谈', date: '2026-06-06' },
  { id: 7, ownerId: 3, customerId: 7, content: '初次拜访，介绍公司产品', method: '面谈', date: '2026-05-20' },
  { id: 8, ownerId: 0, customerId: 8, content: '电话沟通，了解需求', method: '电话', date: '2026-02-10' },
  { id: 9, ownerId: 4, customerId: 9, content: '需求调研完成，准备出方案', method: '面谈', date: '2026-06-04' },
  { id: 10, ownerId: 6, customerId: 10, content: '初次联系，介绍公司', method: '电话', date: '2026-06-01' },
]

// ==================== 业绩目标 ====================
export interface PerformanceTarget {
  id: number; userId: number; year: number; month: number; signTarget: number; paymentTarget: number;
}
export const targets: PerformanceTarget[] = []
for (const u of users.filter(u => u.role === 'sales' || u.role === 'manager')) {
  for (let m = 1; m <= 12; m++) {
    targets.push({
      id: targets.length + 1, userId: u.id, year: 2026, month: m,
      signTarget: 200000 + Math.floor(Math.random() * 300000),
      paymentTarget: 150000 + Math.floor(Math.random() * 200000),
    })
  }
}

// ==================== 产品类型 ====================
export const productTypes = [
  { id: 1, name: '定制首期', sort: 1, enabled: true },
  { id: 2, name: '定制迭代', sort: 2, enabled: true },
  { id: 3, name: '模板新开', sort: 3, enabled: true },
  { id: 4, name: '模板续费', sort: 4, enabled: true },
  { id: 5, name: '代办', sort: 5, enabled: true },
]

// ==================== 系统配置 ====================
export const sysConfig = {
  seaAutoRecycleDays: 30,
  seaDailyClaimLimit: 20,
  contractNoPrefix: 'H',
  contractApproval: true,
  customerNameUnique: false,
  customerPhoneUnique: false,
  customerSources: ['百度', '抖音', '小红书', '淘宝', 'GEO', '其他', '自拓'],
  customerTags: ['H5', '小程序', 'APP', '物联网', 'AI', 'WEB', '客户端'],
}

// ==================== 审批记录 ====================
export interface ApprovalLog { id: number; recordId: number; type: string; action: string; userId: number; comment: string; createdAt: string; }
export const approvalLogs: ApprovalLog[] = [
  { id: 1, recordId: 1, type: 'payment', action: 'approved', userId: 1, comment: '审核通过', createdAt: '2026-02-02' },
  { id: 2, recordId: 2, type: 'payment', action: 'approved', userId: 1, comment: '审核通过', createdAt: '2026-05-03' },
  { id: 3, recordId: 3, type: 'payment', action: 'approved', userId: 2, comment: '审核通过', createdAt: '2026-06-02' },
]

// ==================== 角色权限 ====================
export const roles = [
  { id: 1, name: '超级管理员', permissions: ['all'] },
  { id: 2, name: '管理员', permissions: ['customer:view', 'customer:edit', 'contract:view', 'contract:edit', 'payment:view', 'payment:edit', 'report:view', 'settings:view'] },
  { id: 3, name: '销售经理', permissions: ['customer:view', 'customer:edit', 'contract:view', 'payment:view', 'report:view'] },
  { id: 4, name: '销售', permissions: ['customer:view:own', 'customer:edit:own', 'contract:view:own', 'payment:view:own'] },
]

// ==================== 操作日志 ====================
export interface OperationLog { id: number; userId: number; action: string; module: string; detail: string; ip: string; createdAt: string; }
export const operationLogs: OperationLog[] = [
  { id: 1, userId: 3, action: '新增跟进', module: '客户管理', detail: '对客户【珠海新高度】新增跟进记录', ip: '192.168.1.100', createdAt: '2026-06-02 10:30:00' },
  { id: 2, userId: 4, action: '录入回款', module: '回款管理', detail: '合同【轲影像云相册】录入回款 150,000', ip: '192.168.1.101', createdAt: '2026-06-07 14:20:00' },
  { id: 3, userId: 1, action: '审批通过', module: '审批管理', detail: '审批通过回款记录#9', ip: '192.168.1.1', createdAt: '2026-06-07 16:00:00' },
  { id: 4, userId: 6, action: '新增客户', module: '客户管理', detail: '新增客户【绿源环保】', ip: '192.168.1.102', createdAt: '2026-06-01 09:00:00' },
]
