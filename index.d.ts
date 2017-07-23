export = Kactus

declare namespace Kactus {
    export interface IKactusConfig {
      readonly shareTextStyles?: boolean
      readonly shareLayerStyles?: boolean
      readonly sharedPages?: Array<string>
      readonly ignore?: Array<string>
      readonly root?: string
    }

    export interface IKactusFile {
      readonly path: string
      readonly id: string
      readonly parsed: boolean
      readonly imported: boolean
      readonly lastModified?: number
    }

    export interface IKactusStatusResult {
      readonly config: IKactusConfig
      readonly files: Array<IKactusFile>
    }

    export function parseFile(path: string, config?: IKactusConfig & {sketchVersion?: string}): Promise<void>
    export function importFolder(path: string, config?: IKactusConfig): Promise<void>
    export function parseAll(path: string): Promise<void>
    export function importAll(path: string): Promise<void>
    export function find(path: string): IKactusStatusResult
    export function createNewFile(path: string, config?: IKactusConfig): Promise<void>
}
