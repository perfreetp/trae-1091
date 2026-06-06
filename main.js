const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainMenuWindow;
let restorationWindow;
let materialsWindow;
let labWindow;
let archivesWindow;
let exhibitionWindow;
let trainingWindow;

let gameState = {
  budget: 50000,
  reputation: 0,
  level: 1,
  currentTask: null,
  completedTasks: [],
  materials: {
    cleaningSolution: 10,
    adhesive: 8,
    filler: 5,
    pigment: 12,
    varnish: 6,
    solvent: 4,
    strongCleaner: 0,
    strongAdhesive: 0,
    colorVarnish: 0,
    paintRemover: 0,
    softFiller: 0
  },
  tools: {
    softBrush: { unlocked: true, level: 1 },
    scalpel: { unlocked: true, level: 1 },
    microscope: { unlocked: false, level: 0 },
    laserCleaner: { unlocked: false, level: 0 },
    uvLamp: { unlocked: false, level: 0 },
    xrayMachine: { unlocked: false, level: 0 }
  },
  apprentices: [],
  assignedApprentice: null,
  exhibition: {
    items: [],
    visitorFeedback: [],
    rating: 0
  },
  collection: [],
  labReports: {}
};

function createMainMenu() {
  mainMenuWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    title: '博物馆文物修复工作室',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });
  mainMenuWindow.loadFile('windows/main-menu.html');
  mainMenuWindow.on('closed', () => { app.quit(); });
}

function createWindow(htmlFile, width, height, title) {
  const win = new BrowserWindow({
    width, height, title,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    parent: mainMenuWindow
  });
  win.loadFile(htmlFile);
  return win;
}

ipcMain.handle('get-game-state', () => gameState);
ipcMain.handle('save-game-state', (_, newState) => { gameState = newState; return true; });
ipcMain.handle('update-budget', (_, amount) => {
  gameState.budget += amount;
  return gameState.budget;
});
ipcMain.handle('update-reputation', (_, amount) => {
  gameState.reputation += amount;
  return gameState.reputation;
});
ipcMain.handle('use-material', (_, material, amount) => {
  if (gameState.materials[material] >= amount) {
    gameState.materials[material] -= amount;
    return { success: true, remaining: gameState.materials[material], materials: gameState.materials };
  }
  return { success: false, remaining: gameState.materials[material], materials: gameState.materials };
});
ipcMain.handle('buy-material', (_, material, amount, cost) => {
  if (gameState.budget >= cost) {
    gameState.budget -= cost;
    gameState.materials[material] = (gameState.materials[material] || 0) + amount;
    return { success: true, budget: gameState.budget, materials: gameState.materials };
  }
  return { success: false, budget: gameState.budget };
});
ipcMain.handle('mix-materials', (_, ingredient1, ingredient2, resultKey) => {
  if (gameState.materials[ingredient1] < 1 || gameState.materials[ingredient2] < 1) {
    return { success: false, message: '原料不足' };
  }
  gameState.materials[ingredient1] -= 1;
  gameState.materials[ingredient2] -= 1;
  gameState.materials[resultKey] = (gameState.materials[resultKey] || 0) + 1;
  return { success: true, materials: gameState.materials };
});
ipcMain.handle('unlock-tool', (_, tool, cost) => {
  if (gameState.budget >= cost && !gameState.tools[tool].unlocked) {
    gameState.budget -= cost;
    gameState.tools[tool].unlocked = true;
    gameState.tools[tool].level = 1;
    return { success: true, budget: gameState.budget, tools: gameState.tools };
  }
  return { success: false, budget: gameState.budget, tools: gameState.tools };
});
ipcMain.handle('complete-task', (_, task, quality, restorationLog, extraData) => {
  const reward = Math.floor(task.baseReward * quality);
  gameState.budget += reward;
  gameState.reputation += Math.floor(task.reputation * quality);
  const completedTask = { 
    ...task, 
    quality, 
    completedAt: Date.now(), 
    restorationLog: restorationLog || [],
    labReports: gameState.labReports[task.id] || [],
    stepRatings: extraData?.stepRatings || {},
    toolBonus: extraData?.toolBonus || {},
    forceStats: extraData?.forceStats || {},
    emergencyPenalty: extraData?.emergencyPenalty || 0,
    observeDetails: extraData?.observeDetails || [],
    apprenticeContribution: extraData?.apprenticeContribution || null
  };
  gameState.completedTasks.push(completedTask);
  const artifactWithQuality = { ...task.artifact, restorationQuality: quality };
  const existingIdx = gameState.collection.findIndex(c => c.id === task.artifact.id);
  if (existingIdx >= 0) {
    gameState.collection[existingIdx] = artifactWithQuality;
  } else {
    gameState.collection.push(artifactWithQuality);
  }
  
  if (extraData?.apprenticeContribution) {
    const appIdx = gameState.apprentices.findIndex(a => a.id === extraData.apprenticeContribution.apprenticeId);
    if (appIdx >= 0) {
      gameState.apprentices[appIdx].experience = (gameState.apprentices[appIdx].experience || 0) + extraData.apprenticeContribution.expGained;
    }
  }
  
  if (gameState.labReports[task.id]) {
    delete gameState.labReports[task.id];
  }
  gameState.currentTask = null;
  gameState.assignedApprentice = null;
  return { reward, reputation: Math.floor(task.reputation * quality), gameState, completedTask };
});
ipcMain.handle('set-current-task', (_, task) => {
  gameState.currentTask = task;
  return true;
});
ipcMain.handle('add-lab-report', (_, taskId, report) => {
  if (!gameState.labReports[taskId]) {
    gameState.labReports[taskId] = [];
  }
  gameState.labReports[taskId].push({ ...report, timestamp: Date.now() });
  return { success: true, reports: gameState.labReports[taskId] };
});
ipcMain.handle('get-lab-reports', (_, taskId) => {
  return gameState.labReports[taskId] || [];
});
ipcMain.handle('add-feedback', (_, feedback) => {
  gameState.exhibition.visitorFeedback.push(feedback);
  return true;
});
ipcMain.handle('add-apprentice', (_, apprentice) => {
  gameState.apprentices.push(apprentice);
  return true;
});
ipcMain.handle('train-apprentice', (_, apprenticeId, skill, cost) => {
  if (gameState.budget >= cost) {
    gameState.budget -= cost;
    const app = gameState.apprentices.find(a => a.id === apprenticeId);
    if (app) {
      app.skills[skill] = (app.skills[skill] || 0) + 1;
    }
    return { success: true, budget: gameState.budget, apprentices: gameState.apprentices };
  }
  return { success: false, budget: gameState.budget };
});
ipcMain.handle('exhibit-item', (_, artifact, position) => {
  const existing = gameState.exhibition.items.find(e => e.position === position);
  if (existing) {
    return { success: false, message: '该位置已有展品' };
  }
  gameState.exhibition.items.push({ artifact, position });
  gameState.exhibition.rating = calculateExhibitionRating();
  return { success: true, exhibition: gameState.exhibition };
});
ipcMain.handle('remove-exhibit', (_, position) => {
  gameState.exhibition.items = gameState.exhibition.items.filter(e => e.position !== position);
  gameState.exhibition.rating = calculateExhibitionRating();
  return { success: true, exhibition: gameState.exhibition };
});
ipcMain.handle('update-exhibition-rating', (_, rating) => {
  gameState.exhibition.rating = rating;
  return { success: true, exhibition: gameState.exhibition };
});

let pendingHighlightArtifactId = null;
ipcMain.handle('highlight-archive', (_, artifactId) => {
  pendingHighlightArtifactId = artifactId;
  if (archivesWindow && !archivesWindow.isDestroyed()) {
    archivesWindow.webContents.send('highlight-artifact', artifactId);
  }
  return { success: true };
});

ipcMain.handle('get-pending-highlight', () => {
  const id = pendingHighlightArtifactId;
  pendingHighlightArtifactId = null;
  return id;
});

function calculateExhibitionRating() {
  const items = gameState.exhibition.items;
  if (items.length === 0) return 0;
  const avgRarity = items.reduce((sum, e) => sum + (e.artifact.rarity || 1), 0) / items.length;
  const variety = [...new Set(items.map(e => e.artifact.era))].length;
  const avgQuality = items.reduce((sum, e) => sum + (e.artifact.restorationQuality || 0.7), 0) / items.length;
  return Math.min(5, Math.floor(avgRarity * 0.3 + variety * 0.3 + avgQuality * 5 * 0.4));
}

ipcMain.handle('open-restoration', () => {
  if (!restorationWindow || restorationWindow.isDestroyed()) {
    restorationWindow = createWindow('windows/restoration.html', 1200, 800, '修复台');
  }
  restorationWindow.focus();
});
ipcMain.handle('open-materials', () => {
  if (!materialsWindow || materialsWindow.isDestroyed()) {
    materialsWindow = createWindow('windows/materials.html', 900, 700, '材料柜');
  }
  materialsWindow.focus();
});
ipcMain.handle('open-lab', () => {
  if (!labWindow || labWindow.isDestroyed()) {
    labWindow = createWindow('windows/lab.html', 1000, 700, '检测室');
  }
  labWindow.focus();
});
ipcMain.handle('open-archives', () => {
  if (!archivesWindow || archivesWindow.isDestroyed()) {
    archivesWindow = createWindow('windows/archives.html', 1000, 750, '任务档案');
  }
  archivesWindow.focus();
});
ipcMain.handle('open-exhibition', () => {
  if (!exhibitionWindow || exhibitionWindow.isDestroyed()) {
    exhibitionWindow = createWindow('windows/exhibition.html', 1100, 750, '展厅布置');
  }
  exhibitionWindow.focus();
});
ipcMain.handle('open-training', () => {
  if (!trainingWindow || trainingWindow.isDestroyed()) {
    trainingWindow = createWindow('windows/training.html', 900, 700, '学徒培训');
  }
  trainingWindow.focus();
});
ipcMain.handle('refresh-all-windows', () => {
  const windows = [restorationWindow, materialsWindow, labWindow, archivesWindow, exhibitionWindow, trainingWindow];
  windows.forEach(w => { if (w && !w.isDestroyed()) w.reload(); });
});

app.whenReady().then(createMainMenu);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
