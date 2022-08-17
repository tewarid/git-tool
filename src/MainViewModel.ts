import * as ko from 'knockout';
import { ViewModelBase } from './ViewModelBase';

export class MainViewModel extends ViewModelBase {
    private readonly replacer: string[] = [
        'rootFolder',
        'gitFolders',
        'selectedFolders',
        'gitCommands',
        'log'];
    private busy: ko.Observable<boolean>;
    private rootFolder: ko.Observable<string>;
    private gitFolders: ko.ObservableArray<string>;
    private selectedFolders: ko.ObservableArray<string>;
    private gitCommands: ko.Observable<string>;
    private log: ko.Observable<string>;

    constructor() {
        super();
        ViewModelBase.prefix = 'git-tool';
        this.typeName = 'MainViewModel';
        this.busy = ko.observable<boolean>(false);
        const saved = this.read();
        this.rootFolder = ko.observable<string>(saved.rootFolder);
        this.gitFolders = ko.observableArray<string>(saved.gitFolders);
        this.selectedFolders = ko.observableArray<string>(saved.selectedFolders);
        this.gitCommands = ko.observable<string>(saved.gitCommands || 'status');
        this.log = ko.observable<string>(saved.log || 'status');
    }

    protected save(): void {
        super.save(this.replacer);
    }

    private async selectRootFolder() {
        const dir = await window.electron.selectDirectory();
        this.setRootFolder(dir);
    }

    private async setRootFolder(folder: string) {
        this.rootFolder(folder);
        const list: string[] = await window.electron.findGitDirectories(this.rootFolder());
        this.gitFolders.removeAll();
        list.forEach( (folder) => {
            this.gitFolders.push(folder);
        });
        this.save();
    }

    private runCommands() {
        this.busy(true);
        const config = {
            commands: [new Array()],
            completed: () => {
                this.busy(false);
                this.save();
            },
            executed: (result: any) => {
                let s = `${(new Date()).toISOString()} ${result.command.folder}\n`;
                s += `$ git ${result.command.command}\n${result.output}\n`;
                this.log(this.log() + s);
            },
        };
        this.selectedFolders().forEach((folder) => {
            config.commands = config.commands
                .concat(this.buildGitCommands(folder));
        });
        config.commands.reverse();
        this.process(config);
    }

    private getSelectedCommands(): string[] {
        const commands = this.gitCommands();
        return commands.split('\n');
    }

    private buildGitCommands(folder: string): any {
        const commands: any = [];
        this.getSelectedCommands().forEach((c: string) => {
            if (c.trim() === '') {
                return;
            }
            commands.push({
                command: c,
                folder,
            });
        });
        return commands;
    }

    private process(config: any) {
        if (config.commands.length === 0) {
            config.completed();
            return;
        }
        const command = config.commands.pop();
        if (command.length == 0) {
            this.process(config);
        } else if (command.command.indexOf('clone') !== -1) {
            config.executed({command,
                output: 'Skipping clone command. Please use submodule command instead.\n'});
            this.process(config);
        } else {
            window.electron.executeGitCommand(command.command, command.folder)
                .then((value: string) => {
                    config.executed({command, output: value});
                    this.process(config);
                });
        }
    }

    private clearTerminal() {
        this.log('');
        this.save();
    }
}

