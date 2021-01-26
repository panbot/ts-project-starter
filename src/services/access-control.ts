import { Service } from "typedi";
import { UserContext, Roles } from "../app";

@Service()
export class AccessControlService {

    async assertEntityAccess(
        entity: Object,
        type: 'read' | 'write',
        uc: UserContext,
    ) {
        if (Roles.checkRoles(Roles.Super, uc.roles)) return;

        let ecs = this.getEntityAccessControl(entity);
        if (!ecs) return;

        if (ecs.strategy) {
            return ecs.strategy.assertEntityAccess(entity, type, uc);
        }

        Roles.assertRoles(
            ecs.entityRoles[type],
            uc.roles,
            `insufficient permissions for ${ecs.entityName}`,
        );
    }

    async assertFieldAccess(entity: Object, fields: string[], uc: UserContext): Promise<void> {
        if (Roles.checkRoles(Roles.Super, uc.roles)) return;

        let ecs = this.getEntityAccessControl(entity);
        if (!ecs) return;

        if (ecs.strategy && ecs.strategy.assertFieldAccess) {
            return ecs.strategy.assertFieldAccess(entity, fields, uc);
        }

        for (let field of fields) {
            Roles.assertRoles(
                ecs.fieldRoles.get(field) || 0,
                uc.roles,
                `insufficient permissions for ${ecs.entityName}::${field}`,
            );
        }
    }

    getEntityAccessControl(entity: any) {
        let entityClass: Function;

        if (typeof entity == 'function') {
            entityClass = entity;
        } else {
            entityClass = entity.constructor;
        }

        return Entities.get(entityClass);
    }
}

let Entities = new Map<Function, EntityAccessControl>();

export function EntityRole(type: 'read' | 'write', role: number) {
    return function (entityClass: Function) {
        let eac = getOrInitEntityAccessControl(entityClass);
        eac.entityRoles[type] = role;
    }
}

export function FieldRole(role: number) {
    return function (proto: any, propertyName: string) {
        let eac = getOrInitEntityAccessControl(proto.constructor);
        eac.fieldRoles.set(propertyName, role);
    }
}

export function EntityStrategy(factory: () => EntityAccessControlStrategy) {
    return function (entityClass: Function) {
        let eac = getOrInitEntityAccessControl(entityClass);
        eac.strategyFactory = factory;
    }
}

export interface EntityAccessControlStrategy {

    assertEntityAccess(
        entity: Object,
        type: 'read' | 'write',
        uc: UserContext,
    ): Promise<void>;

    assertFieldAccess?(
        entity: Object,
        fields: string[],
        uc: UserContext,
    ): Promise<void>;

}

function getOrInitEntityAccessControl(entityClass: Function) {
    let eac = Entities.get(entityClass);
    if (eac) return eac;

    eac = new EntityAccessControl();
    eac.entityName = entityClass.name;
    Entities.set(entityClass, eac);
    return eac;
}

class EntityAccessControl {

    entityName: string;

    entityRoles: {
        read: number,
        write: number,
    };

    fieldRoles = new Map<string, number>();

    strategyFactory?: () => EntityAccessControlStrategy;

    private instantiatedStrategy: EntityAccessControlStrategy | null;
    get strategy() {
        if (this.instantiatedStrategy === undefined) {
            if (this.strategyFactory) {
                this.instantiatedStrategy = this.strategyFactory()
            } else {
                this.instantiatedStrategy = null;
            }
        }

        return this.instantiatedStrategy;
    }

    constructor(
    ) {
        this.entityRoles = {
            read: Roles.Anonymous,
            write: Roles.Anonymous,
        }
    }
}
