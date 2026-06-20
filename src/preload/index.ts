import { contextBridge, ipcRenderer } from 'electron'

const api = {
  auth: {
    login: (username: string, password: string) => ipcRenderer.invoke('auth:login', username, password),
    listUsers: () => ipcRenderer.invoke('auth:listUsers'),
    createUser: (fullName: string, username: string, password: string, role: string) =>
      ipcRenderer.invoke('auth:createUser', fullName, username, password, role),
    setUserActive: (id: number, active: boolean) => ipcRenderer.invoke('auth:setUserActive', id, active),
    resetPassword: (id: number, newPassword: string) => ipcRenderer.invoke('auth:resetPassword', id, newPassword)
  },
  ref: {
    departments: () => ipcRenderer.invoke('ref:departments'),
    points: () => ipcRenderer.invoke('ref:points'),
    addPoint: (name: string, type: string, departmentId: number) =>
      ipcRenderer.invoke('ref:addPoint', name, type, departmentId),
    inventoryTableDefs: () => ipcRenderer.invoke('ref:inventoryTableDefs')
  },
  daily: {
    list: (date: string) => ipcRenderer.invoke('daily:list', date),
    create: (entry: unknown) => ipcRenderer.invoke('daily:create', entry),
    delete: (id: number) => ipcRenderer.invoke('daily:delete', id)
  },
  inventory: {
    gridGet: (tableId: string, month: string) => ipcRenderer.invoke('inventory:gridGet', tableId, month),
    gridSet: (tableId: string, month: string, departmentId: number, columnKey: string, value: number) =>
      ipcRenderer.invoke('inventory:gridSet', tableId, month, departmentId, columnKey, value),
    t2_1Get: (month: string) => ipcRenderer.invoke('inventory:t2_1Get', month),
    logList: (tableId: string, month: string) => ipcRenderer.invoke('inventory:logList', tableId, month),
    logAdd: (tableId: string, month: string, data: unknown, createdBy: number) =>
      ipcRenderer.invoke('inventory:logAdd', tableId, month, data, createdBy),
    logDelete: (id: number) => ipcRenderer.invoke('inventory:logDelete', id)
  },
  report: {
    listGenerated: () => ipcRenderer.invoke('report:listGenerated'),
    generateDaily: (date: string, createdBy: number) => ipcRenderer.invoke('report:generateDaily', date, createdBy),
    generateWeekly: (weekStart: string, weekEnd: string, createdBy: number) =>
      ipcRenderer.invoke('report:generateWeekly', weekStart, weekEnd, createdBy),
    generateMonthly: (month: string, createdBy: number) => ipcRenderer.invoke('report:generateMonthly', month, createdBy)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
