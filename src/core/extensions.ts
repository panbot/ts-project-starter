import { Api } from "./api";
import { Roles } from "./auth";
import { ApiArgEnum } from "./api";

export function AuthenticatedApi(doc: string) {
    return Api({ doc, roles: Roles.Authenticated })
}

export function CmsApi(doc: string) {
    return Api({ doc, roles: Roles.CMS })
}

export function ApiArgSortOrder<T>(
    asc: T,
    desc: T,
    defaultValue?: T,
) {
    return ApiArgEnum({
        doc: `排序`,
        defaultValue,
        inputype: typeof asc,
        enum: {
            "升序": asc,
            "降序": desc,
        },
    })
}
