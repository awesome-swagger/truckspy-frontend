import { Pipe, PipeTransform } from '@angular/core';
import { RoleType } from '@app/core/services/rest.model';

const ROLES_PRIORITY = [
    { name: RoleType.ADMIN, friendly: "Admin" },
    { name: RoleType.OWNER, friendly: "Owner" },
    { name: RoleType.USER, friendly: "User" }
];

@Pipe({
    name: 'roleFilter',
})
export class RoleFilterPipe implements PipeTransform {

    transform(value: any): any {
        if (!value || (Array.isArray(value) && value.length == 0)) {
            return "";
        }
        let arrayRoles = Array.isArray(value) ? value : [value];
        for (var i = 0; i < ROLES_PRIORITY.length; i++) {
            let nextRole = ROLES_PRIORITY[i].name;
            if (arrayRoles.includes(nextRole)) {
                return ROLES_PRIORITY[i].friendly;
            }
        }
        return value;
    }

}
