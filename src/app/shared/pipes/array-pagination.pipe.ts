import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe, which implements pagination against arrays.
 * Has 2 arguments: page number and page size.
 * 
 * Usage: `someArray | arrayPagination:1:10`
 *
 * Returns structure of type:
 * ```
 * {
 *   "array": paginatedArray,
 *   "begin": beginIndex,
 *   "end": endIndex
 * }
 * ```
 * 
 * @class ArrayPaginationPipe
 * @implements {PipeTransform}
 */
@Pipe({
    name: 'arrayPagination',
})
export class ArrayPaginationPipe implements PipeTransform {

    transform(theArray: any[], page: number = 1, pageSize = 10): any {
        if (!theArray || theArray.length === 0 || page < 1 || pageSize < 0) {
            return theArray;
        }

        let begin = (page - 1) * pageSize;
        let end = (page) * pageSize;
        end = Math.min(end, theArray.length);
        return {
            array: theArray.slice(begin, end),
            begin: begin,
            end: end
        }
    }

}
