import { Api } from "./api";import { Roles } from "./auth";

export function AuthenticatedApi(doc: string) {
    return Api({ doc, roles: Roles.Authenticated })
}

export function CmsApi(doc: string) {
    return Api({ doc, roles: Roles.CMS })
}
