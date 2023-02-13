import { AccessDeniedError, AuthenticationRequiredError } from "./error";

export const Anonymous     = 0x00000000;
export const Authenticated = 0x00000001;
export const Superuser     = 0x3fffffff;
export const Command       = 0x40000000;

export function checkRoles(
    required: number,
    provided: number,
) {
    return (required & provided) == required;
}

export function assertRoles(
    required: number,
    provided: number,
    message?: string,
) {
    if (!checkRoles(required, provided)) {
        if (Anonymous == provided) {
            throw new AuthenticationRequiredError(message);
        } else {
            throw new AccessDeniedError(message, {
                required,
                provided,
                missing: required ^ provided & required,
            })
        }
    }
}

export default function <R extends Record<string, number>>(extendedRoles: R) {
    for (let key of Object.keys(extendedRoles)) {
        let value = extendedRoles[key];
        if (value > Superuser) throw new Error(
            `Role "${key}" value ${value}(10), 0x${value.toString(16)}(16) is too large. ` +
            `Roles values cannot be larger than that of "Superuser", which is ` +
            `${Superuser.toString()}(10), or 0x${Superuser.toString(16)}(16).`);
    }

    const Roles = {
        Anonymous,
        Authenticated,
        Superuser,
        Command,
        ...extendedRoles,
    };

    const nameRoles = (roles: number): string[] => {
        let matches: string[] = [];

        for (let name of Object.keys(Roles)) {
            let value = Roles[name];
            if (value == roles) return [ name ];
            else if (checkRoles(value, roles)) matches.push(name);
        }

        let filtered: string[] = [];
        while (matches.length) {
            let roleName = matches.pop()!;
            if (
                !isOverlapped(roleName, matches) &&
                !isOverlapped(roleName, filtered)
            ) filtered.push(roleName);
        }

        return filtered;

        function isOverlapped(roleName: string, otherRoleNames: string[]) {
            let roleValue = Roles[roleName];

            for (let anotherRoleName of otherRoleNames) {
                let anotherRoleValue = Roles[anotherRoleName];
                if (checkRoles(roleValue, anotherRoleValue)) return true;
            }

            return false;
        }
    }

    return {
        checkRoles,
        assertRoles,
        nameRoles,
        ...Roles,
    }
}
