import * as ko from 'knockout';

export class ViewModelBase {
    protected static settings: any;
    protected static prefix = 'ko';
    protected typeName = 'ViewModelBase';

    protected read(): any {
        try {
            return JSON.parse(window.localStorage.getItem(`${ViewModelBase.prefix}.${this.typeName}`)) || {};
        } catch {
            return  {};
        }
    }

    protected save(replacer: any = null) {
        window.localStorage.setItem(`${ViewModelBase.prefix}.${this.typeName}`,
            ko.toJSON(this, replacer));
    }
}
