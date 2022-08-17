import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    selectDirectory: () => ipcRenderer.invoke('selectDirectory'),
    findGitDirectories: (root: string) => ipcRenderer.invoke('findGitDirectories', root),
    executeGitCommand: (command: string, cwd: string) => ipcRenderer.invoke('executeGitCommand', command, cwd)
});
