import { Pipe, PipeTransform } from '@angular/core';
import { Question } from '@app/core/services/rest.model';

@Pipe({
    name: 'questionSearch',
})
export class QuestionSearchPipe implements PipeTransform {

    transform(theArray: Question[], query: string = ""): any {
        if (!theArray || theArray.length === 0 || !query) {
            return theArray;
        }
        let noCaseQuery = query.toLowerCase();
        return theArray.filter(
            (question: Question) => {
                let textMatches: boolean = !!question.text && question.text.toLowerCase().includes(noCaseQuery);
                let rdlMatches: boolean = !!question.requireDescriptionLabel() && question.requireDescriptionLabel().toLowerCase().includes(noCaseQuery);
                let ailMatches: boolean = !!question.allowImageLabel() && question.allowImageLabel().toLowerCase().includes(noCaseQuery);
                return textMatches || rdlMatches || ailMatches;
            });
    }

}
