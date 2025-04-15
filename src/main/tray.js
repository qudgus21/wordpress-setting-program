const { Tray, Menu, app } = require("electron");
const path = require("path");

/**
 * 트레이 아이콘을 생성하고 메뉴를 연결합니다.
 * @param {BrowserWindow} mainWindow - 메인 윈도우 인스턴스
 */
function createTray(mainWindow) {
  const iconPath = path.join(__dirname, "icon.png"); // 트레이 아이콘 경로
  const tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "앱 열기",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: "종료",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip("나의 Electron 앱");
  tray.setContextMenu(contextMenu);

  // 클릭 시 창 열기 (더블클릭이나 마우스업 등 이벤트 다양)
  tray.on("click", () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });

  return tray;
}

module.exports = createTray;
