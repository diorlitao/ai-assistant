const { app, BrowserWindow, nativeImage, Tray, Menu, globalShortcut, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const contextMenu = require('electron-context-menu');
const path = require('path');

const image = nativeImage.createFromPath(path.join(__dirname, `images/newiconTemplate.png`));

let mainWindow;
let aboutWindow;
let tray;

// 定义返回给渲染层的相关提示文案
const message = {
  error: '检查更新出错',
  checking: '正在检查更新……',
  updateAva: '检测到新版本，正在下载……',
  updateNotAva: '现在使用的就是最新版本，不用更新',
};

// 托盘右键菜单
const contextMenuTemplate = Menu.buildFromTemplate([
  {
    label: '退出',
    accelerator: 'Ctrl+Q',
    click: () => {
      app.quit();
    },
  },
  {
    label: '重新加载',
    accelerator: 'Ctrl+R',
    click: () => {
      mainWindow.reload();
    },
  },
  {
    label: 'openAI 官网',
    click: () => {
      shell.openExternal('https://chat.openai.com/chat');
    },
  },
  {
    type: 'separator',
  },
  {
    label: '查看源码',
    click: () => {
      shell.openExternal('https://github.com/diorlitao/ai-assistant');
    },
  },
  {
    label: '联系作者',
    click: () => {
      shell.openExternal('https://twitter.com/diorlitao');
    },
  },
  {
    label: '关于',
    click: () => {
      if (!aboutWindow) {
        aboutWindow = new BrowserWindow({
          width: 522,
          height: 464,
          title: 'AI 助手',
          autoHideMenuBar: true,
          webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true, // 允许在渲染进程中使用Node.js特定API
            contextIsolation: false, // 禁用与渲染进程共享上下文
          },
        });
        aboutWindow.loadFile('about.html');
        aboutWindow.on('closed', () => {
          aboutWindow = null;
        });
      }
    },
  },
]);

// 创建浏览器窗口
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 775,
    tray,
    icon: image,
    transparent: path.join(__dirname, `images/iconApp.png`),
    webPreferences: {
      webviewTag: true,
      nodeIntegration: true, // 允许在渲染进程中使用Node.js特定API
      contextIsolation: false, // 禁用与渲染进程共享上下文
    },
    autoHideMenuBar: true, // 隐藏菜单栏
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  // 开发环境下显示devtools
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // 检查更新
  autoUpdater.checkForUpdatesAndNotify();
  // 当更新下载完成，安装程序更新并提示用户重启程序
  autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall();
  });
};

// 加载完成后创建窗口
app.whenReady().then(() => {
  createWindow();

  // 设置 Tray 的右键菜单
  tray = new Tray(image);
  tray.setContextMenu(contextMenuTemplate);

  // 注册全局快捷键 win下Ctrl+Shift+g 显示隐藏
  globalShortcut.register('CommandOrControl+Shift+g', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      if (process.platform == 'darwin') {
        mainWindow.show();
      }
      mainWindow.focus();
    }
  });
});

// 监听 webContentsCreated 事件
app.on('web-contents-created', (e, contents) => {
  if (contents.getType() == 'webview') {
    contents.on('new-window', (e, url) => {
      e.preventDefault();
      shell.openExternal(url);
    });

    //设置右键菜单
    contextMenu({
      window: contents,
      // 中文菜单配置
      labels: {
        copy: '复制',
        paste: '粘贴',
        cut: '剪切',
        selectAll: '全选',
        saveImageAs: '图片另存为',
        lookUpSelection: '查找 “{selection}”',
      },
      prepend: (defaultActions, parameters, browserWindow) => [
        // {
        //   label: 'Rainbow',
        //   visible: parameters.mediaType === 'image',
        // },
        {
          label: '使用Google搜索',
          visible: parameters.selectionText.trim().length > 0,
          click: () => {
            shell.openExternal(`https://google.com/search?q=${encodeURIComponent(parameters.selectionText)}`);
          },
        },
        {
          label: '使用百度搜索',
          visible: parameters.selectionText.trim().length > 0,
          click: () => {
            shell.openExternal(`https://www.baidu.com/s?wd=${encodeURIComponent(parameters.selectionText)}`);
          },
        },
      ],
      showInspectElement: false,
      showSearchWithGoogle: false,
      showInspectElement: false,
      showCopyImageAddress: true,
      showSaveImageAs: true,
      showSaveLinkAs: true,
    });

    // 绑定退出快捷键
    contents.on('before-input-event', (event, input) => {
      const { control, meta, key } = input;
      if (!control && !meta) return;
      if (key === 'q') app.quit();
    });
  }
});

// 在窗口关闭时注销快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// 退出程序时注销窗口引用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 激活程序时创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
