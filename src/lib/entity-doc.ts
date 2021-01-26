export default {
    Doc: (doc: string) => (protoOrClass: any, propertyName?: string) => {
        if (propertyName) {
            let ed = createOrGetEntityDoc(protoOrClass.constructor);

            let fd = ed.fields.get(propertyName);
            if (!fd) {
                fd = new FieldDoc();
                ed.fields.set(propertyName, fd);
            }
            fd.doc = doc;
            fd.type = Reflect.getMetadata('design:type', protoOrClass, propertyName);
        } else {
            let ed = createOrGetEntityDoc(protoOrClass);
            ed.doc = doc;
        }
    },

    Data: (key: string, value: any) => (entityClass: any) => {
        let ed = createOrGetEntityDoc(entityClass);
        ed.data[key] = value;
    },
}

export function getEntityDoc(entityClass: Function) {
    return EntityDocs.get(entityClass);
}

class FieldDoc {
    doc: string;
    type: any;
}

class EntityDoc {
    doc: string;

    fields = new Map<string, FieldDoc>();

    data: any = {};
}

let EntityDocs = new Map<Function, EntityDoc>();

function createOrGetEntityDoc(entityClass: Function) {
    let ed = EntityDocs.get(entityClass);
    if (!ed) {
        ed = new EntityDoc;
        EntityDocs.set(entityClass, ed);
    }
    return ed;
}