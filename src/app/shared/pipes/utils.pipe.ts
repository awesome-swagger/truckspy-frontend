import { Pipe, PipeTransform, Injectable } from '@angular/core';

/**
 * Capitalizes the first character of the string. Transforms `testField` to `TestField`.
 * Usage:
 *  `value | capitalize`
 *  `{{ value | capitalize }}`
 */
@Pipe({
    name: 'capitalize'
})
export class CapitalizePipe implements PipeTransform {

    transform(value: string, args: any[]): string {
        if (!value) {
            return "";
        }
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

}

/**
 * Humanizes the string, adds spaces before every capital case. Transforms `testField` to `Test Field`.
 * Usage:
 *  `value | humanize`
 *  `{{ value | humanize }}`
 */
@Pipe({
    name: 'humanize'
})
export class HumanizePipe {
    transform(value: string) {
        if (!value) {
            return "";
        }
        if ((typeof value) !== "string") {
            return value;
        }
        value = value.split(/(?=[A-Z])/).join(" ");
        value = value[0].toUpperCase() + value.slice(1);
        return value;
    }
}

/**
 * Divides amount (in cents) by 100. Transforms `350` to `3.5`.
 * Usage:
 *  `value | amountHandler`
 *  `{{ value | amountHandler }}`
 */
@Pipe({
    name: 'amountHandler'
})
export class AmountHandlerPipe implements PipeTransform {

    transform(value: number, args: any[]): number {
        if (!value) {
            return 0;
        }
        return value / 100;
    }

}

/**
 * Replaces underscores `_` with spaces ` `. Transforms `Minimum_Wage_Compliance ` to `Minimum Wage Compliance `.
 * Usage:
 *  `value | replaceUnderscore`
 *  `{{ value | replaceUnderscore }}`
 */
@Pipe({ name: 'replaceUnderscore' })
export class ReplaceUnderscorePipe implements PipeTransform {

    transform(value: string): string {
        return value ? value.replace(/_/g, " ") : value;
    }

}

/**
 * Minifies product type name. Transforms `Minimum_Wage_Compliance ` to `MWC `.
 * Usage:
 *  `value | productTypeMin`
 *  `{{ value | productTypeMin }}`
 */
@Pipe({ name: 'productTypeMin' })
export class ProductTypeMinPipe implements PipeTransform {

    transform(value: string): string {
        if (!value) {
            return "";
        }
        let [first, ...rest] = value.split("_").map(function (next: string) {
            return next.charAt(0);
        })
        return rest.length === 0 ? first : `${first}${rest.join("")}`;
    }

}

@Injectable()
export class HTMLGeneratorService {

    constructor(
        private productTypeMin: ProductTypeMinPipe,
        private replaceUnderscore: ReplaceUnderscorePipe) { }

    defaultBadge(): string {
        return `<span title="Default Reporting Profile" class="badge bg-color-blue">
                    Default
                </span>`;
    }

    productBadge(type: string): string {
        let minify = this.productTypeMin.transform(type);
        let full = this.replaceUnderscore.transform(type);
        return `<span title="${full}" class="badge bg-color-gray">
                    ${minify}
                </span>`;
    }

}
