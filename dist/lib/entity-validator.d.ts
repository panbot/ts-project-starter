import "reflect-metadata";
declare const _default: {
    NotBlank(msg?: string): (entity: any, propertyName: string) => void;
    RexExp(regex: RegExp, msg?: string): (entity: any, propertyName: string) => void;
    LessThan(threshold: number, msg?: (threshold: any, v: any) => string): (entity: any, propertyName: string) => void;
    GreaterThan(threshold: number, msg?: (threshold: any, v: any) => string): (entity: any, propertyName: string) => void;
    NoLessThan(threshold: number, msg?: (threshold: any, v: any) => string): (entity: any, propertyName: string) => void;
    NoGreaterThan(threshold: number, msg?: (threshold: any, v: any) => string): (entity: any, propertyName: string) => void;
    validate(entity: any): (boolean | {
        [key: string]: string[];
    })[];
};
export default _default;
